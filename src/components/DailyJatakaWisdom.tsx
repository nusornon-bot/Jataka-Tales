import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarCheck,
  Check,
  Compass,
  Download,
  Flame,
  HelpCircle,
  Loader2,
  RotateCcw,
  Share2,
  Shuffle,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { JATAKA_TALES } from '../data/jatakaData';
import { findNipataForNumber, PREBUILT_BY_NUMBER } from '../data/nipataCatalog';
import { FontSizePreference } from '../types/jataka';
import {
  buildCanonSourceReference,
  CURATED_SOURCE_REFERENCES,
} from '../utils/jatakaSource';
import { downloadWisdomCard, renderWisdomCardBlob } from '../utils/quoteCardExport';
import { useThaiSpeech } from '../utils/speech';

export interface DailyWisdomData {
  jatakaNumber: number;
  thaiTitle: string;
  paliTitle: string;
  nipataName: string;
  barami: string;
  paliVerse: string;
  quote: string;
  moral: string;
  sourceCitation?: string;
  isPrebuiltFallback?: boolean;
}

interface DailyJatakaWisdomProps {
  onUnlockAndOpen: (
    jatakaNumber: number,
    targetMode: 'library' | 'interactive' | 'quiz',
    hint?: { thaiTitle?: string; paliTitle?: string; nipataName?: string }
  ) => void;
  loadingNumber: number | null;
}

const DAILY_WISDOM_STORAGE_KEY = 'sala_jataka_daily_wisdom_v1';
const DAILY_ENGAGEMENT_STORAGE_KEY = 'sala_jataka_daily_engagement_v1';

interface DailyEngagementState {
  lastCheckedDate: string | null;
  streakCount: number;
  totalDays: number;
}

const QUOTE_SIZE_CLASSES: Record<FontSizePreference, string> = {
  sm: 'text-lg sm:text-xl leading-relaxed',
  md: 'text-xl sm:text-2xl leading-relaxed',
  lg: 'text-2xl sm:text-[28px] leading-relaxed',
};

const MORAL_SIZE_CLASSES: Record<FontSizePreference, string> = {
  sm: 'text-xs sm:text-sm leading-relaxed',
  md: 'text-sm sm:text-base leading-relaxed',
  lg: 'text-base sm:text-lg leading-relaxed',
};

function getDateKeyOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateKey(): string {
  return getDateKeyOffset(0);
}

function readDailyEngagement(todayKey: string): DailyEngagementState {
  try {
    const raw = localStorage.getItem(DAILY_ENGAGEMENT_STORAGE_KEY);
    if (!raw) {
      return { lastCheckedDate: null, streakCount: 0, totalDays: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<DailyEngagementState>;
    const last = typeof parsed.lastCheckedDate === 'string' ? parsed.lastCheckedDate : null;
    const yesterday = getDateKeyOffset(-1);
    const rawStreak = typeof parsed.streakCount === 'number' ? parsed.streakCount : 0;
    const totalDays = typeof parsed.totalDays === 'number' ? parsed.totalDays : 0;
    const activeStreak =
      last === todayKey || last === yesterday ? Math.max(0, rawStreak) : 0;
    return {
      lastCheckedDate: last,
      streakCount: activeStreak,
      totalDays: Math.max(0, totalDays),
    };
  } catch {
    return { lastCheckedDate: null, streakCount: 0, totalDays: 0 };
  }
}

function getFormattedThaiDate(): string {
  try {
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return getTodayDateKey();
  }
}

function pickDailyJatakaNumber(dateKey: string): number {
  let hash = 2166136261;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash ^= dateKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (Math.abs(hash) % 547) + 1;
}

function buildPrebuiltWisdom(jatakaNumber: number): DailyWisdomData | null {
  const prebuiltId = PREBUILT_BY_NUMBER[jatakaNumber];
  if (!prebuiltId) return null;
  const tale = JATAKA_TALES.find((t) => t.id === prebuiltId);
  if (!tale) return null;
  const nipata = findNipataForNumber(jatakaNumber);

  const sourceInfo =
    tale.sourceReference ||
    CURATED_SOURCE_REFERENCES[tale.id] ||
    buildCanonSourceReference(jatakaNumber, tale.title);

  return {
    jatakaNumber,
    thaiTitle: tale.title,
    paliTitle: tale.paliTitle,
    nipataName: nipata.thaiName,
    barami: tale.barami,
    paliVerse: tale.paliVerse,
    quote: tale.thaiVerseMeaning,
    moral: tale.moralPoints[0] || tale.dailyApplication,
    sourceCitation: sourceInfo.shortCitation,
  };
}

function buildCuratedFallback(jatakaNumber: number): DailyWisdomData {
  const tale = JATAKA_TALES[jatakaNumber % JATAKA_TALES.length];
  const matchedEntry = Object.entries(PREBUILT_BY_NUMBER).find(
    ([, id]) => id === tale.id
  );
  const fallbackNum = matchedEntry ? Number(matchedEntry[0]) : 547;
  const nipata = findNipataForNumber(fallbackNum);
  const sourceInfo =
    tale.sourceReference ||
    CURATED_SOURCE_REFERENCES[tale.id] ||
    buildCanonSourceReference(fallbackNum, tale.title);

  return {
    jatakaNumber: fallbackNum,
    thaiTitle: tale.title,
    paliTitle: tale.paliTitle,
    nipataName: nipata.thaiName,
    barami: tale.barami,
    paliVerse: tale.paliVerse,
    quote: tale.thaiVerseMeaning,
    moral: tale.moralPoints[0] || tale.dailyApplication,
    sourceCitation: sourceInfo.shortCitation,
    isPrebuiltFallback: true,
  };
}

function readLocalWisdomCache(): Record<string, DailyWisdomData> {
  try {
    const raw = localStorage.getItem(DAILY_WISDOM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DailyWisdomData>) : {};
  } catch {
    return {};
  }
}

function writeLocalWisdomCache(num: number, data: DailyWisdomData) {
  try {
    const current = readLocalWisdomCache();
    current[String(num)] = data;
    localStorage.setItem(DAILY_WISDOM_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

export const DailyJatakaWisdom: React.FC<DailyJatakaWisdomProps> = ({
  onUnlockAndOpen,
  loadingNumber,
}) => {
  const { theme, fontSize, readNumbers, isFavorite, toggleFavorite } = useAppState();
  const todayKey = useMemo(() => getTodayDateKey(), []);
  const formattedThaiDate = useMemo(() => getFormattedThaiDate(), []);
  const dailyNumber = useMemo(() => pickDailyJatakaNumber(todayKey), [todayKey]);

  const [engagement, setEngagement] = useState<DailyEngagementState>(() =>
    readDailyEngagement(todayKey)
  );
  const [selectedNumber, setSelectedNumber] = useState<number>(dailyNumber);
  const [wisdom, setWisdom] = useState<DailyWisdomData | null>(() => {
    const prebuilt = buildPrebuiltWisdom(dailyNumber);
    if (prebuilt) return prebuilt;
    return readLocalWisdomCache()[String(dailyNumber)] || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [cardBusy, setCardBusy] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const { isSupported, isSpeaking, speakingId, speak, stop } = useThaiSpeech();

  const recordDailyCheckIn = () => {
    setEngagement((prev) => {
      if (prev.lastCheckedDate === todayKey) return prev;
      const yesterday = getDateKeyOffset(-1);
      const nextStreak =
        prev.lastCheckedDate === yesterday ? prev.streakCount + 1 : 1;
      const next: DailyEngagementState = {
        lastCheckedDate: todayKey,
        streakCount: nextStreak,
        totalDays: prev.totalDays + 1,
      };
      try {
        localStorage.setItem(DAILY_ENGAGEMENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    const nipata = findNipataForNumber(selectedNumber);

    const prebuilt = buildPrebuiltWisdom(selectedNumber);
    if (prebuilt) {
      setWisdom(prebuilt);
      setIsLoading(false);
      setFallbackNotice(null);
      return;
    }

    const cached = readLocalWisdomCache()[String(selectedNumber)];
    if (cached) {
      setWisdom(cached);
      setIsLoading(false);
      setFallbackNotice(null);
      return;
    }

    setIsLoading(true);
    setFallbackNotice(null);

    fetch('/api/jataka/daily-wisdom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jatakaNumber: selectedNumber,
        nipataName: nipata.thaiName,
      }),
    })
      .then(async (res) => {
        const payload = (await res.json()) as {
          wisdom?: DailyWisdomData;
          error?: string;
        };
        if (!res.ok || !payload.wisdom) {
          throw new Error(payload.error || 'ไม่สามารถดึงข้อคิดประจำวันได้');
        }
        return payload.wisdom;
      })
      .then((fetched) => {
        if (cancelled) return;
        writeLocalWisdomCache(selectedNumber, fetched);
        setWisdom(fetched);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setWisdom(buildCuratedFallback(selectedNumber));
        setFallbackNotice(
          `แสดงข้อคิดจากคลังคัดสรรสำรอง (ลำดับที่ ${selectedNumber} ต้องเชื่อมต่อ API เพื่อสร้างเนื้อหา)`
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedNumber]);

  const handleReroll = () => {
    stop();
    let nextNum = Math.floor(Math.random() * 547) + 1;
    if (nextNum === selectedNumber) {
      nextNum = (nextNum % 547) + 1;
    }
    setSelectedNumber(nextNum);
  };

  const handleResetToDaily = () => {
    stop();
    setSelectedNumber(dailyNumber);
  };

  const handleDownloadCard = async () => {
    if (!wisdom || cardBusy) return;
    setCardBusy(true);
    try {
      await downloadWisdomCard(wisdom, theme === 'dark' ? 'indigo' : 'ivory');
      setShareFeedback('บันทึกภาพการ์ดข้อคิดแล้ว');
      window.setTimeout(() => setShareFeedback(null), 2500);
    } finally {
      setCardBusy(false);
    }
  };

  const handleShareCard = async () => {
    if (!wisdom || cardBusy) return;
    setCardBusy(true);
    try {
      const shareText = `ข้อคิดชาดกประจำวัน จาก${wisdom.thaiTitle} (#${wisdom.jatakaNumber}/547)\n“${wisdom.quote}”\nคติธรรม: ${wisdom.moral}\nที่มา: ${wisdom.sourceCitation || ''}`;
      if (navigator.share) {
        const blob = await renderWisdomCardBlob(
          wisdom,
          theme === 'dark' ? 'indigo' : 'ivory'
        );
        const file = new File(
          [blob],
          `sala-jataka-${String(wisdom.jatakaNumber).padStart(3, '0')}.png`,
          { type: 'image/png' }
        );
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${wisdom.thaiTitle} — ศาลาชาดก`,
            text: shareText,
            files: [file],
          });
        } else {
          await navigator.share({
            title: `${wisdom.thaiTitle} — ศาลาชาดก`,
            text: shareText,
          });
        }
        setShareFeedback('แชร์ข้อคิดแล้ว');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback('คัดลอกข้อความแล้ว');
      }
      window.setTimeout(() => setShareFeedback(null), 2500);
    } catch {
      // User cancelled share sheet
    } finally {
      setCardBusy(false);
    }
  };

  const activeTargetNumber = wisdom?.jatakaNumber ?? selectedNumber;
  const activeWisdomTaleId =
    PREBUILT_BY_NUMBER[activeTargetNumber] || `canon-${activeTargetNumber}`;
  const isWisdomFavorite = isFavorite(activeWisdomTaleId);
  const isAlreadyRead = readNumbers.includes(activeTargetNumber);
  const hasCheckedInToday = engagement.lastCheckedDate === todayKey;
  const isDailySelection = selectedNumber === dailyNumber;
  const isThisPlaying = isSpeaking && speakingId === 'daily-wisdom';
  const isUnlockingThis = loadingNumber === activeTargetNumber;

  const handleToggleSpeech = () => {
    if (!wisdom) return;
    recordDailyCheckIn();
    const textToSpeak = `ข้อคิดชาดกประจำวัน จาก${wisdom.thaiTitle} ชาดกลำดับที่ ${wisdom.jatakaNumber} กล่าวไว้ว่า ${wisdom.quote} ข้อคิดสำคัญคือ ${wisdom.moral}`;
    speak(textToSpeak, 'daily-wisdom');
  };

  const openHint = wisdom
    ? {
        thaiTitle: wisdom.thaiTitle,
        paliTitle: wisdom.paliTitle,
        nipataName: wisdom.nipataName,
      }
    : undefined;

  return (
    <section
      aria-label="ข้อคิดชาดกประจำวัน (Daily Wisdom)"
      className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden"
    >
      {/* Editorial Header Bar */}
      <div className="px-6 py-4 bg-[#FAF8F3] dark:bg-[#151820] border-b border-[#E4DEC9] dark:border-[#2E3442] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
          <span className="font-semibold text-[#92400E] dark:text-amber-400">
            {isDailySelection
              ? 'ข้อคิดชาดกประจำวัน (Daily Wisdom)'
              : 'สุ่มข้อคิดจาก ๕๔๗ ชาดก'}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formattedThaiDate}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-stone-700 dark:text-stone-300">
            ลำดับที่ {String(activeTargetNumber).padStart(3, '0')} / 547
          </span>
          {engagement.streakCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#1E3A8A] dark:text-blue-300">
                <Flame className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                ต่อเนื่อง {engagement.streakCount} วัน
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isDailySelection && (
            <button
              type="button"
              onClick={handleResetToDaily}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              กลับสู่วันนี้
            </button>
          )}
          <button
            type="button"
            onClick={handleReroll}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F3F0E6] bg-[#F3EFE6] dark:bg-[#232732] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342] disabled:opacity-60 rounded-md transition-colors whitespace-nowrap"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
            สุ่มข้อคิดอื่น
          </button>

          <button
            type="button"
            disabled={isLoading || !wisdom}
            aria-pressed={isWisdomFavorite}
            onClick={() => {
              if (!wisdom) return;
              void toggleFavorite({
                taleId: activeWisdomTaleId,
                jatakaNumber: activeTargetNumber,
                title: wisdom.thaiTitle,
                barami: wisdom.barami,
              });
            }}
            title={isWisdomFavorite ? 'นำออกจากรายการโปรด' : 'ติดดาวรายการโปรด'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap disabled:opacity-50 ${
              isWisdomFavorite
                ? 'bg-[#FEF3C7] dark:bg-amber-900/50 text-[#92400E] dark:text-amber-200 border-[#E5C98B] dark:border-amber-700'
                : 'bg-white dark:bg-[#232732] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342]'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isWisdomFavorite
                  ? 'fill-amber-400 text-amber-500 dark:text-amber-300'
                  : ''
              }`}
              aria-hidden="true"
            />
            <span>{isWisdomFavorite ? 'ติดดาวแล้ว' : 'ติดดาว'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleDownloadCard()}
            disabled={isLoading || !wisdom || cardBusy}
            title="บันทึกเป็นภาพการ์ดข้อคิด PNG"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-300" aria-hidden="true" />
            <span>บันทึกการ์ด</span>
          </button>

          <button
            type="button"
            onClick={() => void handleShareCard()}
            disabled={isLoading || !wisdom || cardBusy}
            title="แชร์การ์ดข้อคิดหรือคัดลอกข้อความ"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap"
          >
            {shareFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>{shareFeedback}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
                <span>แชร์</span>
              </>
            )}
          </button>

          {isSupported && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              disabled={isLoading || !wisdom}
              aria-label={isThisPlaying ? 'หยุดเสียงบรรยายข้อคิด' : 'ฟังข้อคิดชาดก'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap disabled:opacity-50 ${
                isThisPlaying
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-white dark:bg-[#232732] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342]'
              }`}
            >
              {isThisPlaying ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                  หยุดฟัง
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-300" aria-hidden="true" />
                  ฟังข้อคิด
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Wisdom Content */}
      <div className="p-6 sm:p-8">
        {isLoading ? (
          <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="กำลังคัดสรรข้อคิดประจำวัน">
            <div className="h-4 w-56 bg-[#EFEAE0] dark:bg-[#232732] rounded" />
            <div className="h-7 w-full max-w-2xl bg-[#EFEAE0] dark:bg-[#232732] rounded" />
            <div className="h-7 w-4/5 max-w-xl bg-[#EFEAE0] dark:bg-[#232732] rounded" />
            <div className="h-4 w-full max-w-lg bg-[#F3EFE6] dark:bg-[#232732] rounded mt-2" />
            <div className="pt-4 flex gap-3">
              <div className="h-9 w-36 bg-[#EFEAE0] dark:bg-[#232732] rounded-md" />
              <div className="h-9 w-32 bg-[#F3EFE6] dark:bg-[#232732] rounded-md" />
            </div>
          </div>
        ) : wisdom ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-[#1C1917] dark:text-[#F3F0E6]">
                  {wisdom.thaiTitle}
                </span>
                <span aria-hidden="true">·</span>
                <span className="italic">{wisdom.paliTitle}</span>
                <span aria-hidden="true">·</span>
                <span>{wisdom.nipataName}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#92400E] dark:text-amber-400">
                  {wisdom.barami}
                </span>
                {isAlreadyRead && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-[#1E3A8A] dark:text-blue-300">
                      อ่านเรื่องนี้แล้ว
                    </span>
                  </>
                )}
              </div>

              <blockquote
                className={`font-serif font-semibold text-[#1C1917] dark:text-[#F3F0E6] [text-wrap:pretty] ${QUOTE_SIZE_CLASSES[fontSize]}`}
              >
                “{wisdom.quote}”
              </blockquote>

              <p
                className={`text-stone-700 dark:text-stone-300 ${MORAL_SIZE_CLASSES[fontSize]}`}
              >
                <span className="font-semibold text-[#1E3A8A] dark:text-blue-300">
                  คติธรรม:{' '}
                </span>
                {wisdom.moral}
              </p>

              {wisdom.paliVerse && (
                <p className="text-xs italic text-stone-500 dark:text-stone-400 pt-1">
                  พระคาถา: {wisdom.paliVerse}
                </p>
              )}

              <p className="text-xs text-stone-500 dark:text-stone-400">
                ที่มา:{' '}
                {wisdom.sourceCitation ||
                  buildCanonSourceReference(wisdom.jatakaNumber, wisdom.thaiTitle)
                    .shortCitation}
              </p>

              {fallbackNotice && (
                <p className="text-xs text-[#92400E] dark:text-amber-400 pt-1">
                  {fallbackNotice}
                </p>
              )}
            </div>

            <div className="lg:col-span-4 bg-[#FAF8F3] dark:bg-[#151820] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg p-4 sm:p-5 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                  ชาดกแนะนำลำดับที่ {wisdom.jatakaNumber} · ต่อยอดทั้ง ๓ โหมด
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  เปิดอ่านเนื้อเรื่องเต็ม สวมบทบาทโต้ตอบ หรือทำแบบทดสอบเพื่อสะสมความต่อเนื่องประจำวัน
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  disabled={loadingNumber !== null}
                  onClick={() => {
                    recordDailyCheckIn();
                    onUnlockAndOpen(wisdom.jatakaNumber, 'library', openHint);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] disabled:opacity-60 rounded-md transition-colors whitespace-nowrap"
                >
                  {isUnlockingThis ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {isUnlockingThis ? 'กำลังเตรียมเนื้อเรื่อง...' : 'อ่านชาดกเรื่องนี้'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loadingNumber !== null}
                    onClick={() => {
                      recordDailyCheckIn();
                      onUnlockAndOpen(wisdom.jatakaNumber, 'interactive', openHint);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342] disabled:opacity-60 rounded-md transition-colors whitespace-nowrap"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
                    เล่นโต้ตอบ
                  </button>
                  <button
                    type="button"
                    disabled={loadingNumber !== null}
                    onClick={() => {
                      recordDailyCheckIn();
                      onUnlockAndOpen(wisdom.jatakaNumber, 'quiz', openHint);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#92400E] dark:text-amber-200 bg-[#FEF3C7]/70 dark:bg-amber-900/35 border border-[#E5C98B] dark:border-amber-700/60 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/55 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap"
                  >
                    <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    ทายข้อคิด
                  </button>
                </div>

                <button
                  type="button"
                  onClick={recordDailyCheckIn}
                  disabled={hasCheckedInToday}
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    hasCheckedInToday
                      ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                      : 'bg-white dark:bg-[#232732] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342]'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  {hasCheckedInToday
                    ? `รับธรรมะประจำวันนี้แล้ว (สะสม ${engagement.totalDays} วัน)`
                    : 'เช็กอินรับธรรมะประจำวันนี้'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};
