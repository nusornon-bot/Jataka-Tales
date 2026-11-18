import type { ExecutionContext, Fetcher, KVNamespace } from '@cloudflare/workers-types';
import seedCacheJson from '../.jataka_cache.json';
import {
  buildDerivedWisdomFromBundle,
  CachedNipataEntry,
  DailyWisdomEntry,
  formatGeminiErrorResponse,
  generateDailyWisdom,
  generateFullBundle,
  generateNipataIndex,
  generateSceneVisual,
  GeneratedJatakaBundle,
  SceneVisual,
  ServerCacheData,
} from '../shared/jatakaCore';

export interface Env {
  GEMINI_API_KEY?: string;
  API_KEY?: string;
  ASSETS: Fetcher;
  JATAKA_KV?: KVNamespace;
}

const WORKER_MISSING_KEY_MSG =
  'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Worker Runtime (ใน Cloudflare Dashboard ต้องเพิ่มใน Settings > Variables and Secrets ของตัว Worker เอง ไม่ใช่ในหมวด Builds > Variables and secrets หรือรัน npx wrangler secret put GEMINI_API_KEY — ท่านยังสามารถอ่านชาดกที่แคชไว้แล้วได้ตามปกติ)';

function getWorkerApiKey(env: Env): string | undefined {
  return env.GEMINI_API_KEY || env.API_KEY;
}

const seedData = seedCacheJson as unknown as Partial<ServerCacheData>;

const memoryCache: ServerCacheData = {
  nipataPages: { ...(seedData.nipataPages || {}) },
  bundles: { ...(seedData.bundles || {}) },
  dailyWisdom: { ...(seedData.dailyWisdom || {}) },
  artworks: { ...(seedData.artworks || {}) },
};

const inFlightNipata = new Map<string, Promise<CachedNipataEntry[]>>();
const inFlightBundles = new Map<string, Promise<GeneratedJatakaBundle>>();
const inFlightWisdom = new Map<string, Promise<DailyWisdomEntry>>();
const inFlightArtworks = new Map<string, Promise<SceneVisual>>();

interface KvMetaIndex {
  cachedNumbers: number[];
  cachedNipataRanges: string[];
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function readKvJson<T>(
  kv: KVNamespace | undefined,
  key: string
): Promise<T | null> {
  if (!kv) return null;
  try {
    return await kv.get<T>(key, 'json');
  } catch {
    return null;
  }
}

async function writeKvJson(
  kv: KVNamespace | undefined,
  key: string,
  value: unknown
): Promise<void> {
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(value));
  } catch {
    // Ignore KV write failures so free-tier limits never break requests
  }
}

async function updateKvMetaIndex(
  kv: KVNamespace | undefined,
  ctx: ExecutionContext
): Promise<void> {
  if (!kv) return;
  ctx.waitUntil(
    (async () => {
      try {
        const existing = (await readKvJson<KvMetaIndex>(kv, 'meta:index')) || {
          cachedNumbers: [],
          cachedNipataRanges: [],
        };
        const nums = new Set([
          ...existing.cachedNumbers,
          ...Object.keys(memoryCache.bundles)
            .map(Number)
            .filter((n) => !Number.isNaN(n)),
        ]);
        const ranges = new Set([
          ...existing.cachedNipataRanges,
          ...Object.keys(memoryCache.nipataPages),
        ]);
        await kv.put(
          'meta:index',
          JSON.stringify({
            cachedNumbers: Array.from(nums).sort((a, b) => a - b),
            cachedNipataRanges: Array.from(ranges),
          })
        );
      } catch {
        // Ignore KV metadata errors
      }
    })()
  );
}

async function handleStatus(env: Env): Promise<Response> {
  const localNumbers = Object.keys(memoryCache.bundles)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const localRanges = Object.keys(memoryCache.nipataPages);

  const kvMeta = await readKvJson<KvMetaIndex>(env.JATAKA_KV, 'meta:index');
  const cachedNumbers = Array.from(
    new Set([...localNumbers, ...(kvMeta?.cachedNumbers || [])])
  ).sort((a, b) => a - b);
  const cachedNipataRanges = Array.from(
    new Set([...localRanges, ...(kvMeta?.cachedNipataRanges || [])])
  );

  return jsonResponse({ cachedNumbers, cachedNipataRanges });
}

async function handleGetBundles(env: Env): Promise<Response> {
  if (env.JATAKA_KV) {
    const kvMeta = await readKvJson<KvMetaIndex>(env.JATAKA_KV, 'meta:index');
    const missingNums = (kvMeta?.cachedNumbers || []).filter(
      (n) => Number.isInteger(n) && n >= 1 && n <= 547 && !memoryCache.bundles[String(n)]
    );
    if (missingNums.length > 0) {
      await Promise.all(
        missingNums.map(async (n) => {
          const kvBundle = await readKvJson<GeneratedJatakaBundle>(
            env.JATAKA_KV,
            `bundle:${n}`
          );
          if (kvBundle) {
            memoryCache.bundles[String(n)] = kvBundle;
          }
        })
      );
    }
  }

  const bundles = Object.values(memoryCache.bundles).sort(
    (a, b) => a.jatakaNumber - b.jatakaNumber
  );
  return jsonResponse({ bundles });
}

async function handleGetBundleByNumber(num: number, env: Env): Promise<Response> {
  if (!Number.isInteger(num) || num < 1 || num > 547) {
    return jsonResponse({ error: 'กรุณาระบุเลขลำดับชาดกระหว่าง 1 ถึง 547' }, 400);
  }
  const key = String(num);
  if (memoryCache.bundles[key]) {
    return jsonResponse({ bundle: memoryCache.bundles[key], fromCache: true });
  }
  const kvBundle = await readKvJson<GeneratedJatakaBundle>(
    env.JATAKA_KV,
    `bundle:${key}`
  );
  if (kvBundle) {
    memoryCache.bundles[key] = kvBundle;
    return jsonResponse({ bundle: kvBundle, fromCache: true });
  }
  return jsonResponse({ error: 'ยังไม่มีชาดกเรื่องนี้ในแคชระบบ' }, 404);
}

async function handleNipataIndex(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const body = await parseJsonBody<{
      nipataName?: string;
      startNo?: number;
      endNo?: number;
    }>(request);
    if (!body) {
      return jsonResponse({ error: 'รูปแบบคำขอ JSON ไม่ถูกต้อง' }, 400);
    }

    const start = Math.max(1, Math.min(547, Number(body.startNo) || 1));
    const end = Math.max(start, Math.min(547, Number(body.endNo) || start));
    if (end - start > 35) {
      return jsonResponse({ error: 'ช่วงลำดับต่อหน้าต้องไม่เกิน 35 เรื่อง' }, 400);
    }

    const key = `${start}-${end}`;
    if (memoryCache.nipataPages[key]) {
      return jsonResponse({ entries: memoryCache.nipataPages[key], fromCache: true });
    }

    const kvCached = await readKvJson<CachedNipataEntry[]>(
      env.JATAKA_KV,
      `nipata:${key}`
    );
    if (kvCached) {
      memoryCache.nipataPages[key] = kvCached;
      return jsonResponse({ entries: kvCached, fromCache: true });
    }

    let pending = inFlightNipata.get(key);
    if (!pending) {
      pending = generateNipataIndex(
        getWorkerApiKey(env),
        body.nipataName || 'ขุททกนิกาย ชาดก',
        start,
        end
      ).finally(() => {
        inFlightNipata.delete(key);
      });
      inFlightNipata.set(key, pending);
    }

    const entries = await pending;
    memoryCache.nipataPages[key] = entries;
    if (env.JATAKA_KV) {
      ctx.waitUntil(writeKvJson(env.JATAKA_KV, `nipata:${key}`, entries));
      await updateKvMetaIndex(env.JATAKA_KV, ctx);
    }

    return jsonResponse({ entries, fromCache: false });
  } catch (err: unknown) {
    const formatted = formatGeminiErrorResponse(
      err,
      'ไม่สามารถดึงสารบัญนิบาตได้',
      WORKER_MISSING_KEY_MSG
    );
    return jsonResponse(
      {
        error: formatted.message,
        quotaExceeded: formatted.quotaExceeded,
        cachedRanges: Object.keys(memoryCache.nipataPages),
      },
      formatted.status
    );
  }
}

async function handleBundle(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const body = await parseJsonBody<{
      jatakaNumber?: number;
      thaiTitle?: string;
      paliTitle?: string;
      nipataName?: string;
    }>(request);
    if (!body) {
      return jsonResponse({ error: 'รูปแบบคำขอ JSON ไม่ถูกต้อง' }, 400);
    }

    const num = Number(body.jatakaNumber);
    if (!Number.isInteger(num) || num < 1 || num > 547) {
      return jsonResponse({ error: 'กรุณาระบุเลขลำดับชาดกระหว่าง 1 ถึง 547' }, 400);
    }

    const key = String(num);
    if (memoryCache.bundles[key]) {
      return jsonResponse({ bundle: memoryCache.bundles[key], fromCache: true });
    }

    const kvCached = await readKvJson<GeneratedJatakaBundle>(
      env.JATAKA_KV,
      `bundle:${key}`
    );
    if (kvCached) {
      memoryCache.bundles[key] = kvCached;
      return jsonResponse({ bundle: kvCached, fromCache: true });
    }

    let pending = inFlightBundles.get(key);
    if (!pending) {
      pending = generateFullBundle(
        getWorkerApiKey(env),
        num,
        body.thaiTitle,
        body.paliTitle,
        body.nipataName
      ).finally(() => {
        inFlightBundles.delete(key);
      });
      inFlightBundles.set(key, pending);
    }

    const bundle = await pending;
    memoryCache.bundles[key] = bundle;
    if (env.JATAKA_KV) {
      ctx.waitUntil(writeKvJson(env.JATAKA_KV, `bundle:${key}`, bundle));
      await updateKvMetaIndex(env.JATAKA_KV, ctx);
    }

    return jsonResponse({ bundle, fromCache: false });
  } catch (err: unknown) {
    const formatted = formatGeminiErrorResponse(
      err,
      'ไม่สามารถเรียบเรียงชาดกเรื่องนี้ได้',
      WORKER_MISSING_KEY_MSG
    );
    return jsonResponse(
      {
        error: formatted.message,
        quotaExceeded: formatted.quotaExceeded,
      },
      formatted.status
    );
  }
}

async function handleDailyWisdom(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const body = await parseJsonBody<{
      jatakaNumber?: number;
      nipataName?: string;
    }>(request);
    if (!body) {
      return jsonResponse({ error: 'รูปแบบคำขอ JSON ไม่ถูกต้อง' }, 400);
    }

    const num = Number(body.jatakaNumber);
    if (!Number.isInteger(num) || num < 1 || num > 547) {
      return jsonResponse({ error: 'กรุณาระบุเลขลำดับชาดกระหว่าง 1 ถึง 547' }, 400);
    }

    const key = String(num);
    if (memoryCache.dailyWisdom[key]) {
      return jsonResponse({ wisdom: memoryCache.dailyWisdom[key], fromCache: true });
    }

    const kvWisdom = await readKvJson<DailyWisdomEntry>(
      env.JATAKA_KV,
      `wisdom:${key}`
    );
    if (kvWisdom) {
      memoryCache.dailyWisdom[key] = kvWisdom;
      return jsonResponse({ wisdom: kvWisdom, fromCache: true });
    }

    const cachedBundle =
      memoryCache.bundles[key] ||
      (await readKvJson<GeneratedJatakaBundle>(env.JATAKA_KV, `bundle:${key}`));
    if (cachedBundle) {
      memoryCache.bundles[key] = cachedBundle;
      const derived = buildDerivedWisdomFromBundle(
        num,
        cachedBundle,
        body.nipataName
      );
      memoryCache.dailyWisdom[key] = derived;
      if (env.JATAKA_KV) {
        ctx.waitUntil(writeKvJson(env.JATAKA_KV, `wisdom:${key}`, derived));
      }
      return jsonResponse({ wisdom: derived, fromCache: true });
    }

    let pending = inFlightWisdom.get(key);
    if (!pending) {
      pending = generateDailyWisdom(
        getWorkerApiKey(env),
        num,
        body.nipataName
      ).finally(() => {
        inFlightWisdom.delete(key);
      });
      inFlightWisdom.set(key, pending);
    }

    const wisdom = await pending;
    memoryCache.dailyWisdom[key] = wisdom;
    if (env.JATAKA_KV) {
      ctx.waitUntil(writeKvJson(env.JATAKA_KV, `wisdom:${key}`, wisdom));
    }

    return jsonResponse({ wisdom, fromCache: false });
  } catch (err: unknown) {
    const formatted = formatGeminiErrorResponse(
      err,
      'ไม่สามารถดึงข้อคิดประจำวันได้',
      WORKER_MISSING_KEY_MSG
    );
    return jsonResponse(
      {
        error: formatted.message,
        quotaExceeded: formatted.quotaExceeded,
      },
      formatted.status
    );
  }
}

async function handleArtwork(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const body = await parseJsonBody<{
      jatakaNumber?: number;
      title?: string;
      summary?: string;
    }>(request);
    if (!body) {
      return jsonResponse({ error: 'รูปแบบคำขอ JSON ไม่ถูกต้อง' }, 400);
    }

    const num = Number(body.jatakaNumber);
    if (!Number.isInteger(num) || num < 1 || num > 547) {
      return jsonResponse({ error: 'กรุณาระบุเลขลำดับชาดก 1-547' }, 400);
    }

    const key = String(num);
    if (memoryCache.artworks[key]) {
      return jsonResponse({ sceneVisual: memoryCache.artworks[key], fromCache: true });
    }

    const kvArtwork = await readKvJson<SceneVisual>(
      env.JATAKA_KV,
      `artwork:${key}`
    );
    if (kvArtwork) {
      memoryCache.artworks[key] = kvArtwork;
      return jsonResponse({ sceneVisual: kvArtwork, fromCache: true });
    }

    const existingBundleVisual = memoryCache.bundles[key]?.tale?.sceneVisual;
    if (existingBundleVisual) {
      memoryCache.artworks[key] = existingBundleVisual;
      if (env.JATAKA_KV) {
        ctx.waitUntil(
          writeKvJson(env.JATAKA_KV, `artwork:${key}`, existingBundleVisual)
        );
      }
      return jsonResponse({ sceneVisual: existingBundleVisual, fromCache: true });
    }

    let pending = inFlightArtworks.get(key);
    if (!pending) {
      pending = generateSceneVisual(
        getWorkerApiKey(env),
        num,
        body.title,
        body.summary
      ).finally(() => {
        inFlightArtworks.delete(key);
      });
      inFlightArtworks.set(key, pending);
    }

    const sceneVisual = await pending;
    memoryCache.artworks[key] = sceneVisual;
    if (memoryCache.bundles[key]?.tale) {
      memoryCache.bundles[key].tale.sceneVisual = sceneVisual;
    }
    if (env.JATAKA_KV) {
      ctx.waitUntil(writeKvJson(env.JATAKA_KV, `artwork:${key}`, sceneVisual));
    }

    return jsonResponse({ sceneVisual, fromCache: false });
  } catch (err: unknown) {
    const formatted = formatGeminiErrorResponse(
      err,
      'ไม่สามารถออกแบบฉากภาพประกอบได้',
      WORKER_MISSING_KEY_MSG
    );
    return jsonResponse(
      {
        error: formatted.message,
        quotaExceeded: formatted.quotaExceeded,
      },
      formatted.status
    );
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith('/api/')) {
      if (request.method === 'GET' && pathname === '/api/jataka/status') {
        return handleStatus(env);
      }
      if (request.method === 'GET' && pathname === '/api/jataka/bundles') {
        return handleGetBundles(env);
      }
      if (request.method === 'GET' && pathname.startsWith('/api/jataka/bundle/')) {
        const num = Number(pathname.slice('/api/jataka/bundle/'.length));
        return handleGetBundleByNumber(num, env);
      }
      if (request.method === 'POST' && pathname === '/api/jataka/nipata-index') {
        return handleNipataIndex(request, env, ctx);
      }
      if (request.method === 'POST' && pathname === '/api/jataka/bundle') {
        return handleBundle(request, env, ctx);
      }
      if (request.method === 'POST' && pathname === '/api/jataka/daily-wisdom') {
        return handleDailyWisdom(request, env, ctx);
      }
      if (request.method === 'POST' && pathname === '/api/jataka/artwork') {
        return handleArtwork(request, env, ctx);
      }

      return jsonResponse({ error: 'ไม่พบเส้นทาง API ที่ร้องขอ' }, 404);
    }

    return env.ASSETS.fetch(request as unknown as Parameters<Fetcher['fetch']>[0]) as unknown as Promise<Response>;
  },
};
