import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export const PRIMARY_MODEL = 'gemini-4-hydrogen';
export const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

export interface CachedNipataEntry {
  number: number;
  thaiTitle: string;
  paliTitle: string;
  theme: string;
  baramiHint: string;
}

export interface SceneVisual {
  motif:
    | 'bodhi'
    | 'ocean'
    | 'desert'
    | 'river'
    | 'sky'
    | 'forest'
    | 'celestial'
    | 'rain';
  settingLabel: string;
  focalElement:
    | 'bodhi'
    | 'ship'
    | 'deer'
    | 'monkey'
    | 'lotus'
    | 'palace'
    | 'naga'
    | 'elephant'
    | 'sage'
    | 'scale';
  skyTop: string;
  skyBottom: string;
  accentColor: string;
}

export interface GeneratedJatakaBundle {
  jatakaNumber: number;
  tale: {
    id: string;
    indexLabel: string;
    title: string;
    paliTitle: string;
    collection: string;
    virtue: string;
    barami: string;
    readTimeMinutes: number;
    imageCaption: string;
    summary: string;
    paragraphs: string[];
    paliVerse: string;
    thaiVerseMeaning: string;
    moralPoints: string[];
    dailyApplication: string;
    sourceReference?: {
      pitakaText: string;
      nipataAndOrder: string;
      commentaryText: string;
      presentContext?: string;
      shortCitation: string;
    };
    samodhana?: Array<{
      pastCharacter: string;
      presentIdentity: string;
    }>;
    glossary?: Array<{
      term: string;
      meaning: string;
    }>;
    sceneVisual?: SceneVisual;
  };
  interactive: {
    id: string;
    taleId: string;
    title: string;
    shortLabel: string;
    subtitle: string;
    virtueFocus: string;
    endingSummary: string;
    scenes: Array<{
      id: string;
      chapterLabel: string;
      title: string;
      narrative: string;
      choices: Array<{
        id: string;
        label: string;
        description: string;
        outcomeText: string;
        dhammaReflection: string;
        isBodhisattaWay: boolean;
        virtueDelta: {
          mindfulness: number;
          perseverance: number;
          wisdom: number;
        };
        nextSceneId: string | null;
      }>;
    }>;
  };
  quiz: Array<{
    id: string;
    category: 'ทายข้อคิดจากเรื่อง' | 'ทายชื่อชาดก' | 'บารมีและหลักธรรม';
    taleTitle: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface DailyWisdomEntry {
  jatakaNumber: number;
  thaiTitle: string;
  paliTitle: string;
  nipataName: string;
  barami: string;
  paliVerse: string;
  quote: string;
  moral: string;
  sourceCitation?: string;
}

export interface ServerCacheData {
  nipataPages: Record<string, CachedNipataEntry[]>;
  bundles: Record<string, GeneratedJatakaBundle>;
  dailyWisdom: Record<string, DailyWisdomEntry>;
  artworks: Record<string, SceneVisual>;
}

export function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const maybeStatus = (err as { status?: number }).status;
  if (maybeStatus === 429) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('quota')
  );
}

export function formatGeminiErrorResponse(
  err: unknown,
  defaultMessage: string,
  missingKeyMessage?: string
) {
  if (isQuotaError(err)) {
    return {
      status: 429,
      quotaExceeded: true,
      message:
        'โควตาการเรียกใช้ Gemini API แบบ Free Tier ประจำวันครบแล้ว กรุณารอสักครู่หรือตรวจสอบ Secret GEMINI_API_KEY (ท่านยังสามารถอ่านเรื่องและหมวดที่โหลดไว้แล้วได้ตามปกติ)',
    };
  }
  const raw = err instanceof Error ? err.message : defaultMessage;
  if (raw.includes('MISSING_GEMINI_API_KEY')) {
    return {
      status: 503,
      quotaExceeded: false,
      message:
        missingKeyMessage ||
        'ยังไม่ได้ตั้งค่า GEMINI_API_KEY บนเซิร์ฟเวอร์ (ท่านยังสามารถอ่านชาดกและหมวดที่โหลดไว้แล้วได้ตามปกติ)',
    };
  }
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 400,
      quotaExceeded: false,
      message:
        'API Key ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง กรุณาตรวจสอบค่า Secret GEMINI_API_KEY บนเซิร์ฟเวอร์',
    };
  }
  return {
    status: 500,
    quotaExceeded: false,
    message: defaultMessage,
  };
}

export function getGenAIClient(apiKey?: string) {
  const trimmed = apiKey?.trim();
  if (!trimmed) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }
  return new GoogleGenAI({
    apiKey: trimmed,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateWithFallback(
  apiKey: string | undefined,
  buildParams: (
    model: string,
    useThinking: boolean
  ) => Parameters<GoogleGenAI['models']['generateContent']>[0]
) {
  const ai = getGenAIClient(apiKey);
  try {
    return await ai.models.generateContent(buildParams(PRIMARY_MODEL, true));
  } catch (primaryErr) {
    if (!isQuotaError(primaryErr)) {
      throw primaryErr;
    }
    return await ai.models.generateContent(buildParams(FALLBACK_MODEL, false));
  }
}

export function mapVirtueCategory(raw: string): string {
  const allowed = [
    'ทานและเมตตา',
    'ศีลและเนกขัมมะ',
    'ความเพียรและอธิษฐาน',
    'ปัญญาและสติ',
    'ขันติ สัจจะ อุเบกขา',
  ];
  if (allowed.includes(raw)) return raw;
  if (raw.includes('ทาน') || raw.includes('เมตตา')) return 'ทานและเมตตา';
  if (raw.includes('ศีล') || raw.includes('เนกขัม')) return 'ศีลและเนกขัมมะ';
  if (raw.includes('เพียร') || raw.includes('วิริยะ') || raw.includes('อธิษฐาน'))
    return 'ความเพียรและอธิษฐาน';
  if (raw.includes('ขันติ') || raw.includes('สัจ') || raw.includes('อุเบกขา'))
    return 'ขันติ สัจจะ อุเบกขา';
  return 'ปัญญาและสติ';
}

export function mapQuizCategory(
  raw: string,
  idx: number
): 'ทายข้อคิดจากเรื่อง' | 'ทายชื่อชาดก' | 'บารมีและหลักธรรม' {
  if (
    raw === 'ทายข้อคิดจากเรื่อง' ||
    raw === 'ทายชื่อชาดก' ||
    raw === 'บารมีและหลักธรรม'
  ) {
    return raw;
  }
  const fallback: Array<
    'ทายข้อคิดจากเรื่อง' | 'ทายชื่อชาดก' | 'บารมีและหลักธรรม'
  > = ['ทายข้อคิดจากเรื่อง', 'ทายชื่อชาดก', 'บารมีและหลักธรรม'];
  return fallback[idx % 3];
}

export async function generateNipataIndex(
  apiKey: string | undefined,
  nipataName: string,
  startNo: number,
  endNo: number
): Promise<CachedNipataEntry[]> {
  const count = endNo - startNo + 1;

  const response = await generateWithFallback(apiKey, (model, useThinking) => ({
    model,
    contents: `จงจัดทำสารบัญนิทานชาดกในพระไตรปิฎก (ขุททกนิกาย ชาดก) หมวด "${nipataName}" ตั้งแต่ชาดกลำดับที่ ${startNo} ถึง ${endNo} (รวม ${count} เรื่อง ตามลำดับมาตรฐานในพระไตรปิฎกบาลี/สยามรัฐ/PTS)
ระบุสำหรับแต่ละลำดับ:
- number: เลขลำดับที่ (${startNo} ถึง ${endNo})
- thaiTitle: ชื่อชาดกภาษาไทย (เช่น อปัณณกชาดก, วัณณุปถชาดก)
- paliTitle: ชื่อภาษาบาลี/อังกฤษ (เช่น Apannaka Jataka)
- theme: สรุปแก่นเรื่องสั้นๆ 1 ประโยคภาษาไทย
- baramiHint: คุณธรรมหลักหรือบารมีเด่น (สั้นกระชับ)`,
    config: {
      systemInstruction:
        'คุณเป็นผู้เชี่ยวชาญพระไตรปิฎกภาษาไทยและบาลี ตอบข้อมูลตามลำดับชาดกในพระไตรปิฎกอย่างเที่ยงตรง สุภาพ และกระชับเป็นภาษาไทย',
      ...(useThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            number: { type: Type.INTEGER },
            thaiTitle: { type: Type.STRING },
            paliTitle: { type: Type.STRING },
            theme: { type: Type.STRING },
            baramiHint: { type: Type.STRING },
          },
          required: ['number', 'thaiTitle', 'paliTitle', 'theme', 'baramiHint'],
        },
      },
    },
  }));

  const text = (response.text ?? '[]').trim();
  const parsed = JSON.parse(text) as CachedNipataEntry[];
  return parsed.sort((a, b) => a.number - b.number);
}

export async function generateFullBundle(
  apiKey: string | undefined,
  jatakaNumber: number,
  thaiTitle?: string,
  paliTitle?: string,
  nipataName?: string
): Promise<GeneratedJatakaBundle> {
  const titleHint = thaiTitle
    ? `ชื่อ "${thaiTitle}" (${paliTitle || ''})`
    : `ลำดับที่ ${jatakaNumber} ในพระไตรปิฎก`;
  const nipataHint = nipataName ? `หมวด ${nipataName}` : '';

  const response = await generateWithFallback(apiKey, (model, useThinking) => ({
    model,
    contents: `จงเรียบเรียงข้อมูลนิทานชาดกในพระไตรปิฎก (ขุททกนิกาย ชาดก) ลำดับที่ ${jatakaNumber} ${titleHint} ${nipataHint} ให้ครบทั้ง 3 รูปแบบการเรียนรู้ใน JSON เดียวกัน:

1. tale (คลังนิทานชาดก):
   - title: ชื่อชาดกภาษาไทยที่ถูกต้อง (เช่น "อปัณณกชาดก")
   - paliTitle: ชื่อภาษาบาลี/อังกฤษ (เช่น "Apannaka Jataka")
   - collection: ชื่อนิบาตและลำดับ (เช่น "เอกกนิบาต · ชาดกที่ ${jatakaNumber}")
   - virtue: เลือก 1 ค่าจาก ["ทานและเมตตา", "ศีลและเนกขัมมะ", "ความเพียรและอธิษฐาน", "ปัญญาและสติ", "ขันติ สัจจะ อุเบกขา"]
   - barami: คุณธรรม/บารมีหลักของเรื่อง
   - readTimeMinutes: ตัวเลข 2 ถึง 5
   - imageCaption: คำบรรยายฉากสำคัญของชาดกเรื่องนี้ 1 ประโยค
   - summary: เรื่องย่อ 2 ประโยค
   - paragraphs: เนื้อเรื่องเต็มภาษาไทยสละสลวย 4 ย่อหน้า (เล่าตั้งแต่ปฐมเหตุในอดีต เหตุการณ์สำคัญ การคลี่คลาย และบทสรุป)
   - paliVerse: คาถาบาลีเด่นของเรื่อง (หรือหัวใจคาถาอ้างอิง)
   - thaiVerseMeaning: คำแปลความหมายสุภาษิตเป็นภาษาไทย
   - moralPoints: ข้อคิดธรรมสำคัญ 3 ข้อ
   - dailyApplication: การนำไปประยุกต์ใช้ในชีวิตประจำวัน 1 ย่อหน้าสั้น
   - sourceReference: ที่มาและแหล่งอ้างอิงในพระคัมภีร์
     - pitakaText: อ้างอิงพระไตรปิฎก (เช่น "พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๗ (ฉบับหลวง / มจร.)")
     - nipataAndOrder: นิบาต วรรค และลำดับชาดก (เช่น "เอกกนิบาต · อปัณณกวรรค · ลำดับที่ 1 / 547")
     - commentaryText: อ้างอิงอรรถกถา (เช่น "อรรถกถาขุททกนิกาย เอกกนิบาต อปัณณกชาดก (ชาตกัฏฐกถา)")
     - presentContext: ปัจจุบันวัตถุ/เหตุการณ์ที่พระพุทธเจ้าทรงปรารภในตอนต้นเรื่อง 1 ประโยค
     - shortCitation: อ้างอิงแบบย่อ (เช่น "ขุ. ชา. เอกกนิบาต (๒๗) ลำดับที่ 1 · อรรถกถา")
   - samodhana: การประชุมชาดก (สโมธาน) 2 ถึง 3 รายการว่าตัวละครในอดีตชาติกลับมาเป็นใครในพุทธกาล (pastCharacter, presentIdentity)
   - glossary: ศัพทานุกรมคำศัพท์บาลีหรือคำสำคัญในเรื่อง 3 คำ (term, meaning)
   - sceneVisual: องค์ประกอบภาพประกอบประจำเรื่อง (motif: เลือก 1 จาก bodhi|ocean|desert|river|sky|forest|celestial|rain, settingLabel: คำอธิบายบรรยากาศฉากสั้นๆ, focalElement: เลือก 1 จาก bodhi|ship|deer|monkey|lotus|palace|naga|elephant|sage|scale, skyTop: โค้ดสี hex เข้มเช่น "#142038", skyBottom: โค้ดสี hex เช่น "#283B64", accentColor: โค้ดสี hex ทอง/อำพัน เช่น "#FBBF24")

2. interactive (นิทานโต้ตอบ 3 บท):
   - title: ชื่อเรื่องสั้นๆ พร้อมหัวข้อสถานการณ์โต้ตอบ
   - subtitle: คำชวนสวมบทบาทตัวละครเอก
   - virtueFocus: คุณธรรม 3 คำคั่นด้วย " · "
   - endingSummary: บทสรุปหลังจบเรื่อง 1 ย่อหน้า
   - scenes: จำนวน 3 บทพอดี (chapterLabel เป็น "บทที่ 1 / 3", "บทที่ 2 / 3", "บทที่ 3 / 3")
     - บทที่ 1 และบทที่ 2 มี 2 ทางเลือก (choices) ทางเลือกหนึ่งตรงตามแนวทางพระโพธิสัตว์ (isBodhisattaWay: true) อีกทางเลือกเป็นบทเรียนทางโลก (isBodhisattaWay: false) โดย nextSceneId ของบทที่ 1 ชี้ไป id ของบทที่ 2, ของบทที่ 2 ชี้ไป id ของบทที่ 3
     - บทที่ 3 มี 1 ทางเลือกสรุปเรื่อง โดย nextSceneId เป็น null (สตริงว่าง "" หาก schema ต้องส่ง หรือ null)
     - virtueDelta: ค่าบวก 5 ถึง 40 สำหรับ mindfulness, perseverance, wisdom

3. quiz (คำถามทายข้อคิด 3 ข้อ):
   - ข้อ 1 category = "ทายข้อคิดจากเรื่อง"
   - ข้อ 2 category = "ทายชื่อชาดก"
   - ข้อ 3 category = "บารมีและหลักธรรม"
   - แต่ละข้อมี options 4 ตัวเลือก และ correctIndex (0 ถึง 3) พร้อม explanation อธิบายชัดเจน`,
    config: {
      systemInstruction:
        'คุณเป็นนักวิชาการพระไตรปิฎกและนักเขียนนิทานชาดกภาษาไทย ใช้ข้อมูลตรงตามคัมภีร์ชาดกอรรถกถา อ่านง่าย เหมาะกับผู้เรียนทุกวัย',
      ...(useThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tale: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              paliTitle: { type: Type.STRING },
              collection: { type: Type.STRING },
              virtue: { type: Type.STRING },
              barami: { type: Type.STRING },
              readTimeMinutes: { type: Type.INTEGER },
              imageCaption: { type: Type.STRING },
              summary: { type: Type.STRING },
              paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
              paliVerse: { type: Type.STRING },
              thaiVerseMeaning: { type: Type.STRING },
              moralPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              dailyApplication: { type: Type.STRING },
              sourceReference: {
                type: Type.OBJECT,
                properties: {
                  pitakaText: { type: Type.STRING },
                  nipataAndOrder: { type: Type.STRING },
                  commentaryText: { type: Type.STRING },
                  presentContext: { type: Type.STRING },
                  shortCitation: { type: Type.STRING },
                },
                required: [
                  'pitakaText',
                  'nipataAndOrder',
                  'commentaryText',
                  'presentContext',
                  'shortCitation',
                ],
              },
              samodhana: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pastCharacter: { type: Type.STRING },
                    presentIdentity: { type: Type.STRING },
                  },
                  required: ['pastCharacter', 'presentIdentity'],
                },
              },
              glossary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                  },
                  required: ['term', 'meaning'],
                },
              },
              sceneVisual: {
                type: Type.OBJECT,
                properties: {
                  motif: { type: Type.STRING },
                  settingLabel: { type: Type.STRING },
                  focalElement: { type: Type.STRING },
                  skyTop: { type: Type.STRING },
                  skyBottom: { type: Type.STRING },
                  accentColor: { type: Type.STRING },
                },
                required: [
                  'motif',
                  'settingLabel',
                  'focalElement',
                  'skyTop',
                  'skyBottom',
                  'accentColor',
                ],
              },
            },
            required: [
              'title',
              'paliTitle',
              'collection',
              'virtue',
              'barami',
              'readTimeMinutes',
              'imageCaption',
              'summary',
              'paragraphs',
              'paliVerse',
              'thaiVerseMeaning',
              'moralPoints',
              'dailyApplication',
              'sourceReference',
              'samodhana',
              'glossary',
              'sceneVisual',
            ],
          },
          interactive: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              virtueFocus: { type: Type.STRING },
              endingSummary: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    chapterLabel: { type: Type.STRING },
                    title: { type: Type.STRING },
                    narrative: { type: Type.STRING },
                    choices: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING },
                          description: { type: Type.STRING },
                          outcomeText: { type: Type.STRING },
                          dhammaReflection: { type: Type.STRING },
                          isBodhisattaWay: { type: Type.BOOLEAN },
                          virtueDelta: {
                            type: Type.OBJECT,
                            properties: {
                              mindfulness: { type: Type.INTEGER },
                              perseverance: { type: Type.INTEGER },
                              wisdom: { type: Type.INTEGER },
                            },
                            required: ['mindfulness', 'perseverance', 'wisdom'],
                          },
                          nextSceneId: { type: Type.STRING, nullable: true },
                        },
                        required: [
                          'id',
                          'label',
                          'description',
                          'outcomeText',
                          'dhammaReflection',
                          'isBodhisattaWay',
                          'virtueDelta',
                          'nextSceneId',
                        ],
                      },
                    },
                  },
                  required: ['id', 'chapterLabel', 'title', 'narrative', 'choices'],
                },
              },
            },
            required: ['title', 'subtitle', 'virtueFocus', 'endingSummary', 'scenes'],
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                prompt: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: [
                'category',
                'prompt',
                'options',
                'correctIndex',
                'explanation',
              ],
            },
          },
        },
        required: ['tale', 'interactive', 'quiz'],
      },
    },
  }));

  const rawText = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawText) as {
    tale: GeneratedJatakaBundle['tale'];
    interactive: Omit<
      GeneratedJatakaBundle['interactive'],
      'id' | 'taleId' | 'shortLabel'
    >;
    quiz: Array<{
      category: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }>;
  };

  const padded = String(jatakaNumber).padStart(3, '0');
  const taleId = `canon-${jatakaNumber}`;
  const interactiveId = `interactive-canon-${jatakaNumber}`;

  const scenes = (parsed.interactive?.scenes || []).map((sc, idx, arr) => {
    const nextId =
      idx + 1 < arr.length
        ? arr[idx + 1].id || `c${jatakaNumber}-s${idx + 2}`
        : null;
    const sceneId = sc.id || `c${jatakaNumber}-s${idx + 1}`;
    return {
      ...sc,
      id: sceneId,
      choices: (sc.choices || []).map((ch, cIdx) => ({
        ...ch,
        id: ch.id || `${sceneId}-c${cIdx + 1}`,
        nextSceneId: idx === arr.length - 1 ? null : nextId,
      })),
    };
  });

  const volLabel = jatakaNumber >= 526 ? 'เล่มที่ ๒๘' : 'เล่มที่ ๒๗';
  const volShort = jatakaNumber >= 526 ? '๒๘' : '๒๗';
  const fallbackSource = {
    pitakaText: `พระสุตตันตปิฎก ขุททกนิกาย ชาดก ${volLabel} (ฉบับหลวง / มจร.)`,
    nipataAndOrder: `${nipataName || parsed.tale.collection} · ลำดับที่ ${jatakaNumber} / 547`,
    commentaryText: `อรรถกถาขุททกนิกาย ${parsed.tale.title} (ชาตกัฏฐกถา)`,
    shortCitation: `ขุ. ชา. (${volShort}) ลำดับที่ ${jatakaNumber} · อรรถกถา ${parsed.tale.title}`,
  };

  return {
    jatakaNumber,
    tale: {
      ...parsed.tale,
      id: taleId,
      indexLabel: padded,
      virtue: mapVirtueCategory(parsed.tale?.virtue || ''),
      readTimeMinutes: Math.max(
        2,
        Math.min(6, parsed.tale?.readTimeMinutes || 3)
      ),
      sourceReference: parsed.tale?.sourceReference?.pitakaText
        ? parsed.tale.sourceReference
        : fallbackSource,
    },
    interactive: {
      id: interactiveId,
      taleId,
      title: parsed.interactive?.title || parsed.tale.title,
      shortLabel: `#${jatakaNumber} ${parsed.tale.title}`,
      subtitle: parsed.interactive?.subtitle || parsed.tale.summary,
      virtueFocus: parsed.interactive?.virtueFocus || parsed.tale.barami,
      endingSummary:
        parsed.interactive?.endingSummary || parsed.tale.dailyApplication,
      scenes,
    },
    quiz: (parsed.quiz || []).map((q, idx) => ({
      id: `canon-q-${jatakaNumber}-${idx + 1}`,
      category: mapQuizCategory(q.category, idx),
      taleTitle: parsed.tale.title,
      prompt: q.prompt,
      options: q.options.slice(0, 4),
      correctIndex: Math.max(0, Math.min(3, q.correctIndex || 0)),
      explanation: q.explanation,
    })),
  };
}

export function buildDerivedWisdomFromBundle(
  jatakaNumber: number,
  bundle: GeneratedJatakaBundle,
  nipataName?: string
): DailyWisdomEntry {
  return {
    jatakaNumber,
    thaiTitle: bundle.tale.title,
    paliTitle: bundle.tale.paliTitle,
    nipataName: nipataName || bundle.tale.collection,
    barami: bundle.tale.barami,
    paliVerse: bundle.tale.paliVerse,
    quote: bundle.tale.thaiVerseMeaning,
    moral: bundle.tale.moralPoints?.[0] || bundle.tale.dailyApplication,
    sourceCitation:
      bundle.tale.sourceReference?.shortCitation ||
      `พระสุตตันตปิฎก ขุททกนิกาย ชาดก (${jatakaNumber >= 526 ? '๒๘' : '๒๗'}) ลำดับที่ ${jatakaNumber} · อรรถกถา ${bundle.tale.title}`,
  };
}

export async function generateDailyWisdom(
  apiKey: string | undefined,
  jatakaNumber: number,
  nipataName?: string
): Promise<DailyWisdomEntry> {
  const nipataHint = nipataName ? `ในหมวด "${nipataName}"` : '';

  const response = await generateWithFallback(apiKey, (model, useThinking) => ({
    model,
    contents: `จงสรุปข้อคิดประจำวันจากนิทานชาดกในพระไตรปิฎก (ขุททกนิกาย ชาดก) ลำดับที่ ${jatakaNumber} ${nipataHint} ตามลำดับมาตรฐานของคัมภีร์ชาดกอรรถกถา:
- thaiTitle: ชื่อชาดกภาษาไทยที่ถูกต้อง (เช่น อปัณณกชาดก)
- paliTitle: ชื่อภาษาบาลี/อังกฤษ (เช่น Apannaka Jataka)
- nipataName: ชื่อนิบาตภาษาไทย (เช่น เอกกนิบาต)
- barami: คุณธรรมหรือบารมีเด่น 1 วลีสั้นๆ (เช่น ปัญญาบารมี และความไม่ประมาท)
- paliVerse: คาถาบาลีหรือหัวใจคาถาเด่นของชาดกเรื่องนี้ (สั้นกระชับ 1-2 บาท)
- quote: คำคมหรือบทแปลสุภาษิตหลักจากชาดกเรื่องนี้ เป็นภาษาไทยที่สละสลวย กินใจ 1-2 ประโยค
- moral: คติธรรมสำคัญและการนำไปประยุกต์ใช้ในชีวิตประจำวันอย่างกระชับ 1-2 ประโยค
- sourceCitation: แหล่งอ้างอิงในพระไตรปิฎกและอรรถกถาแบบกระชับ (เช่น "พระสุตตันตปิฎก ขุททกนิกาย ชาดก เอกกนิบาต (๒๗) ลำดับที่ 1 · อรรถกถาอปัณณกชาดก")`,
    config: {
      systemInstruction:
        'คุณเป็นผู้เชี่ยวชาญพระไตรปิฎกและวรรณกรรมชาดกภาษาไทย ถ่ายทอดสุภาษิตและข้อคิดธรรมจากชาดกทั้ง 547 เรื่องอย่างถูกต้อง สุขุม ลุ่มลึก และอ่านเข้าใจง่าย',
      ...(useThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          thaiTitle: { type: Type.STRING },
          paliTitle: { type: Type.STRING },
          nipataName: { type: Type.STRING },
          barami: { type: Type.STRING },
          paliVerse: { type: Type.STRING },
          quote: { type: Type.STRING },
          moral: { type: Type.STRING },
          sourceCitation: { type: Type.STRING },
        },
        required: [
          'thaiTitle',
          'paliTitle',
          'nipataName',
          'barami',
          'paliVerse',
          'quote',
          'moral',
          'sourceCitation',
        ],
      },
    },
  }));

  const rawText = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawText) as Omit<DailyWisdomEntry, 'jatakaNumber'>;
  const volShort = jatakaNumber >= 526 ? '๒๘' : '๒๗';

  return {
    jatakaNumber,
    thaiTitle: parsed.thaiTitle || `ชาดกลำดับที่ ${jatakaNumber}`,
    paliTitle: parsed.paliTitle || `Jataka No. ${jatakaNumber}`,
    nipataName: parsed.nipataName || nipataName || 'ขุททกนิกาย ชาดก',
    barami: parsed.barami || 'สติและปัญญา',
    paliVerse: parsed.paliVerse || 'วิริเยน ทุกฺขมจฺเจติ',
    quote: parsed.quote || '',
    moral: parsed.moral || '',
    sourceCitation:
      parsed.sourceCitation ||
      `พระสุตตันตปิฎก ขุททกนิกาย ชาดก (${volShort}) ลำดับที่ ${jatakaNumber} · อรรถกถาชาดก`,
  };
}

export async function generateSceneVisual(
  apiKey: string | undefined,
  jatakaNumber: number,
  title?: string,
  summary?: string
): Promise<SceneVisual> {
  const response = await generateWithFallback(apiKey, (model, useThinking) => ({
    model,
    contents: `ออกแบบองค์ประกอบฉากภาพจิตรกรรมไทยประกอบนิทานชาดกลำดับที่ ${jatakaNumber} เรื่อง "${title || ''}" (${summary || ''}):
- motif: 1 ค่าจาก [bodhi, ocean, desert, river, sky, forest, celestial, rain]
- settingLabel: คำบรรยายฉากภาษาไทยสั้นๆ 1 วลี
- focalElement: 1 ค่าจาก [bodhi, ship, deer, monkey, lotus, palace, naga, elephant, sage, scale]
- skyTop: โค้ดสี hex โทนกลางคืนหรือครามเข้มเช่น "#142038"
- skyBottom: โค้ดสี hex เช่น "#243B61"
- accentColor: โค้ดสี hex โทนทองคำเปลว เช่น "#FBBF24"`,
    config: {
      ...(useThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          motif: { type: Type.STRING },
          settingLabel: { type: Type.STRING },
          focalElement: { type: Type.STRING },
          skyTop: { type: Type.STRING },
          skyBottom: { type: Type.STRING },
          accentColor: { type: Type.STRING },
        },
        required: [
          'motif',
          'settingLabel',
          'focalElement',
          'skyTop',
          'skyBottom',
          'accentColor',
        ],
      },
    },
  }));

  return JSON.parse((response.text ?? '{}').trim()) as SceneVisual;
}
