import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
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
} from './shared/jatakaCore';

const PORT = Number(process.env.PORT) || 3000;
const CACHE_FILE = path.resolve(process.cwd(), '.jataka_cache.json');

const memoryCache: ServerCacheData = {
  nipataPages: {},
  bundles: {},
  dailyWisdom: {},
  artworks: {},
};

async function loadDiskCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ServerCacheData>;
    if (parsed.nipataPages) {
      Object.assign(memoryCache.nipataPages, parsed.nipataPages);
    }
    if (parsed.bundles) {
      Object.assign(memoryCache.bundles, parsed.bundles);
    }
    if (parsed.dailyWisdom) {
      Object.assign(memoryCache.dailyWisdom, parsed.dailyWisdom);
    }
    if (parsed.artworks) {
      Object.assign(memoryCache.artworks, parsed.artworks);
    }
  } catch {
    // Cache file may not exist on first boot
  }
}

async function saveDiskCache() {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(memoryCache), 'utf-8');
  } catch {
    // Ignore disk write failure on read-only environments
  }
}

const inFlightNipata = new Map<string, Promise<CachedNipataEntry[]>>();
const inFlightBundles = new Map<string, Promise<GeneratedJatakaBundle>>();
const inFlightWisdom = new Map<string, Promise<DailyWisdomEntry>>();
const inFlightArtworks = new Map<string, Promise<SceneVisual>>();

async function startServer() {
  await loadDiskCache();

  const app = express();
  app.use(express.json());

  app.get('/api/jataka/status', (_req: Request, res: Response) => {
    const cachedNumbers = Object.keys(memoryCache.bundles)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const cachedNipataRanges = Object.keys(memoryCache.nipataPages);
    res.json({ cachedNumbers, cachedNipataRanges });
  });

  app.post('/api/jataka/nipata-index', async (req: Request, res: Response) => {
    try {
      const { nipataName, startNo, endNo } = req.body as {
        nipataName?: string;
        startNo?: number;
        endNo?: number;
      };

      const start = Math.max(1, Math.min(547, Number(startNo) || 1));
      const end = Math.max(start, Math.min(547, Number(endNo) || start));
      if (end - start > 35) {
        res.status(400).json({ error: 'ช่วงลำดับต่อหน้าต้องไม่เกิน 35 เรื่อง' });
        return;
      }

      const key = `${start}-${end}`;
      if (memoryCache.nipataPages[key]) {
        res.json({ entries: memoryCache.nipataPages[key], fromCache: true });
        return;
      }

      let pending = inFlightNipata.get(key);
      if (!pending) {
        pending = generateNipataIndex(
          process.env.GEMINI_API_KEY,
          nipataName || 'ขุททกนิกาย ชาดก',
          start,
          end
        ).finally(() => {
          inFlightNipata.delete(key);
        });
        inFlightNipata.set(key, pending);
      }

      const entries = await pending;
      memoryCache.nipataPages[key] = entries;
      await saveDiskCache();
      res.json({ entries, fromCache: false });
    } catch (err: unknown) {
      const formatted = formatGeminiErrorResponse(err, 'ไม่สามารถดึงสารบัญนิบาตได้');
      if (formatted.quotaExceeded) {
        console.warn('nipata-index quota reached (429)');
      } else {
        console.warn('nipata-index warning:', formatted.message);
      }
      res.status(formatted.status).json({
        error: formatted.message,
        quotaExceeded: formatted.quotaExceeded,
        cachedRanges: Object.keys(memoryCache.nipataPages),
      });
    }
  });

  app.post('/api/jataka/bundle', async (req: Request, res: Response) => {
    try {
      const { jatakaNumber, thaiTitle, paliTitle, nipataName } = req.body as {
        jatakaNumber?: number;
        thaiTitle?: string;
        paliTitle?: string;
        nipataName?: string;
      };

      const num = Number(jatakaNumber);
      if (!Number.isInteger(num) || num < 1 || num > 547) {
        res
          .status(400)
          .json({ error: 'กรุณาระบุเลขลำดับชาดกระหว่าง 1 ถึง 547' });
        return;
      }

      const key = String(num);
      if (memoryCache.bundles[key]) {
        res.json({ bundle: memoryCache.bundles[key], fromCache: true });
        return;
      }

      let pending = inFlightBundles.get(key);
      if (!pending) {
        pending = generateFullBundle(
          process.env.GEMINI_API_KEY,
          num,
          thaiTitle,
          paliTitle,
          nipataName
        ).finally(() => {
          inFlightBundles.delete(key);
        });
        inFlightBundles.set(key, pending);
      }

      const bundle = await pending;
      memoryCache.bundles[key] = bundle;
      await saveDiskCache();
      res.json({ bundle, fromCache: false });
    } catch (err: unknown) {
      const formatted = formatGeminiErrorResponse(err, 'ไม่สามารถเรียบเรียงชาดกเรื่องนี้ได้');
      console.warn('bundle warning:', formatted.message);
      res.status(formatted.status).json({
        error: formatted.message,
        quotaExceeded: formatted.quotaExceeded,
      });
    }
  });

  app.post('/api/jataka/daily-wisdom', async (req: Request, res: Response) => {
    try {
      const { jatakaNumber, nipataName } = req.body as {
        jatakaNumber?: number;
        nipataName?: string;
      };

      const num = Number(jatakaNumber);
      if (!Number.isInteger(num) || num < 1 || num > 547) {
        res
          .status(400)
          .json({ error: 'กรุณาระบุเลขลำดับชาดกระหว่าง 1 ถึง 547' });
        return;
      }

      const key = String(num);
      if (memoryCache.dailyWisdom[key]) {
        res.json({ wisdom: memoryCache.dailyWisdom[key], fromCache: true });
        return;
      }

      const cachedBundle = memoryCache.bundles[key];
      if (cachedBundle) {
        const derived = buildDerivedWisdomFromBundle(num, cachedBundle, nipataName);
        memoryCache.dailyWisdom[key] = derived;
        await saveDiskCache();
        res.json({ wisdom: derived, fromCache: true });
        return;
      }

      let pending = inFlightWisdom.get(key);
      if (!pending) {
        pending = generateDailyWisdom(
          process.env.GEMINI_API_KEY,
          num,
          nipataName
        ).finally(() => {
          inFlightWisdom.delete(key);
        });
        inFlightWisdom.set(key, pending);
      }

      const wisdom = await pending;
      memoryCache.dailyWisdom[key] = wisdom;
      await saveDiskCache();
      res.json({ wisdom, fromCache: false });
    } catch (err: unknown) {
      const formatted = formatGeminiErrorResponse(err, 'ไม่สามารถดึงข้อคิดประจำวันได้');
      console.warn('daily-wisdom warning:', formatted.message);
      res.status(formatted.status).json({
        error: formatted.message,
        quotaExceeded: formatted.quotaExceeded,
      });
    }
  });

  app.post('/api/jataka/artwork', async (req: Request, res: Response) => {
    try {
      const { jatakaNumber, title, summary } = req.body as {
        jatakaNumber?: number;
        title?: string;
        summary?: string;
      };
      const num = Number(jatakaNumber);
      if (!Number.isInteger(num) || num < 1 || num > 547) {
        res.status(400).json({ error: 'กรุณาระบุเลขลำดับชาดก 1-547' });
        return;
      }
      const key = String(num);
      if (memoryCache.artworks[key]) {
        res.json({ sceneVisual: memoryCache.artworks[key], fromCache: true });
        return;
      }
      const existingBundleVisual = memoryCache.bundles[key]?.tale?.sceneVisual;
      if (existingBundleVisual) {
        memoryCache.artworks[key] = existingBundleVisual;
        await saveDiskCache();
        res.json({ sceneVisual: existingBundleVisual, fromCache: true });
        return;
      }

      let pending = inFlightArtworks.get(key);
      if (!pending) {
        pending = generateSceneVisual(
          process.env.GEMINI_API_KEY,
          num,
          title,
          summary
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
      await saveDiskCache();
      res.json({ sceneVisual, fromCache: false });
    } catch (err: unknown) {
      const formatted = formatGeminiErrorResponse(err, 'ไม่สามารถออกแบบฉากภาพประกอบได้');
      console.warn('artwork warning:', formatted.message);
      res.status(formatted.status).json({
        error: formatted.message,
        quotaExceeded: formatted.quotaExceeded,
      });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`86I / Sala Jataka server listening on port ${PORT}`);
  });
}

startServer();
