import React, { useMemo } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, Compass } from 'lucide-react';
import { getJatakaNumberByTaleId, PREBUILT_BY_NUMBER } from '../data/nipataCatalog';
import { JatakaTale } from '../types/jataka';

const TOTAL_CANON_JATAKAS = 547;

interface ReadingProgressTrackerProps {
  tales: JatakaTale[];
  readNumbers: number[];
  unlockedNumbers?: number[];
  variant?: 'home' | 'library';
  onOpenTale?: (taleId: string) => void;
  onOpenLibrary?: () => void;
  onOpen547Catalog?: () => void;
  onFilterUnread?: () => void;
}

export const ReadingProgressTracker: React.FC<ReadingProgressTrackerProps> = ({
  tales,
  readNumbers,
  unlockedNumbers = [],
  variant = 'library',
  onOpenTale,
  onOpenLibrary,
  onOpen547Catalog,
  onFilterUnread,
}) => {
  const stats = useMemo(() => {
    const readSet = new Set(
      readNumbers.filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_CANON_JATAKAS
      )
    );

    const prebuiltNums = Object.keys(PREBUILT_BY_NUMBER).map(Number);
    const unlockedSet = new Set(
      [...prebuiltNums, ...unlockedNumbers].filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_CANON_JATAKAS
      )
    );

    const isTaleRead = (tale: JatakaTale): boolean => {
      const num = getJatakaNumberByTaleId(tale.id);
      return num !== null && readSet.has(num);
    };

    const collectionTotal = tales.length;
    const collectionRead = tales.filter(isTaleRead).length;
    const collectionUnread = Math.max(0, collectionTotal - collectionRead);
    const collectionPercentExact =
      collectionTotal > 0 ? (collectionRead / collectionTotal) * 100 : 0;
    const collectionPercentRounded = Math.round(collectionPercentExact);

    const tosachatTales = tales.filter((t) => t.collectionGroup === 'tosachat');
    const tosachatTotal = tosachatTales.length;
    const tosachatRead = tosachatTales.filter(isTaleRead).length;
    const tosachatPercent =
      tosachatTotal > 0 ? Math.round((tosachatRead / tosachatTotal) * 100) : 0;

    const nipataTales = tales.filter((t) => t.collectionGroup === 'nipata');
    const nipataTotal = nipataTales.length;
    const nipataRead = nipataTales.filter(isTaleRead).length;
    const nipataPercent =
      nipataTotal > 0 ? Math.round((nipataRead / nipataTotal) * 100) : 0;

    const canonRead = readSet.size;
    const canonPercentExact = (canonRead / TOTAL_CANON_JATAKAS) * 100;
    const canonPercentLabel =
      canonRead >= TOTAL_CANON_JATAKAS
        ? '100%'
        : canonRead === 0
        ? '0%'
        : `${canonPercentExact.toFixed(1)}%`;

    const unlockedUnreadCount = Array.from(unlockedSet).filter(
      (n) => !readSet.has(n)
    ).length;

    const nextUnreadTale = tales.find((tale) => !isTaleRead(tale)) || null;

    return {
      collectionTotal,
      collectionRead,
      collectionUnread,
      collectionPercentExact,
      collectionPercentRounded,
      tosachatTotal,
      tosachatRead,
      tosachatPercent,
      nipataTotal,
      nipataRead,
      nipataPercent,
      canonRead,
      canonPercentExact,
      canonPercentLabel,
      unlockedCount: unlockedSet.size,
      unlockedUnreadCount,
      nextUnreadTale,
    };
  }, [tales, readNumbers, unlockedNumbers]);

  // SVG circular gauge geometry
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference -
    (Math.min(100, Math.max(0, stats.collectionPercentExact)) / 100) *
      ringCircumference;

  const isCollectionComplete =
    stats.collectionTotal > 0 && stats.collectionRead >= stats.collectionTotal;

  return (
    <section
      aria-label="ตัวติดตามความคืบหน้าการอ่านชาดก"
      className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-6 py-4 bg-[#FAF8F3] dark:bg-[#151820] border-b border-[#E4DEC9] dark:border-[#2E3442] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#92400E] dark:text-amber-400 font-semibold">
            <BookOpenCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>บันทึกความคืบหน้าการอ่านชาดก</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              คลังพร้อมอ่าน {stats.collectionRead} / {stats.collectionTotal} เรื่อง
            </span>
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
            {variant === 'home'
              ? 'สถิติการอ่านนิทานชาดกในคลังของคุณ'
              : 'ความคืบหน้าการอ่านแยกตามหมวดหมู่และพระไตรปิฎก ๕๔๗ เรื่อง'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {variant === 'library' &&
            onFilterUnread &&
            stats.collectionUnread > 0 && (
              <button
                type="button"
                onClick={onFilterUnread}
                className="px-3 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap"
              >
                ดูเรื่องที่ยังไม่อ่าน ({stats.collectionUnread})
              </button>
            )}

          {stats.nextUnreadTale && onOpenTale ? (
            <button
              type="button"
              onClick={() => onOpenTale(stats.nextUnreadTale!.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors whitespace-nowrap"
            >
              <span>อ่านเรื่องถัดไป: {stats.nextUnreadTale.title}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>
          ) : (
            onOpen547Catalog && (
              <button
                type="button"
                onClick={onOpen547Catalog}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#92400E] dark:text-amber-200 bg-[#FEF3C7]/70 dark:bg-amber-900/40 border border-[#E5C98B] dark:border-amber-700/60 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/60 rounded-md transition-colors whitespace-nowrap"
              >
                <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>เปิดสารบัญ ๕๔๗ เรื่อง</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Radial Progress Gauge */}
        <div className="md:col-span-4 flex items-center gap-5 p-4 rounded-lg bg-[#FAF8F3] dark:bg-[#151820] border border-[#E4DEC9] dark:border-[#2E3442]">
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 112 112"
              className="w-full h-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="56"
                cy="56"
                r={ringRadius}
                fill="none"
                strokeWidth="10"
                className="stroke-[#EFEAE0] dark:stroke-[#232732]"
              />
              <circle
                cx="56"
                cy="56"
                r={ringRadius}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className={`transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none ${
                  isCollectionComplete
                    ? 'stroke-[#15803D] dark:stroke-emerald-400'
                    : 'stroke-[#1E3A8A] dark:stroke-blue-400'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className={`font-serif text-2xl font-bold font-mono tabular-nums leading-none ${
                  isCollectionComplete
                    ? 'text-[#15803D] dark:text-emerald-300'
                    : 'text-[#1E3A8A] dark:text-blue-300'
                }`}
              >
                {stats.collectionPercentRounded}%
              </span>
              <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 mt-1">
                {stats.collectionRead}/{stats.collectionTotal}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              ความสมบูรณ์คลังพร้อมอ่าน
            </div>
            <div className="font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              {isCollectionComplete ? (
                <span className="inline-flex items-center gap-1.5 text-[#15803D] dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  อ่านครบทั้งคลังแล้ว
                </span>
              ) : (
                <span>อ่านแล้ว {stats.collectionRead} เรื่อง</span>
              )}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {isCollectionComplete
                ? 'สามารถปลดล็อกเรื่องใหม่เพิ่มเติมได้จากสารบัญ ๕๔๗ เรื่อง'
                : `เหลืออีก ${stats.collectionUnread} เรื่องในคลังพร้อมอ่าน`}
            </p>
            {variant === 'home' && onOpenLibrary && (
              <button
                type="button"
                onClick={onOpenLibrary}
                className="inline-flex items-center gap-1 pt-0.5 text-xs font-semibold text-[#1E3A8A] dark:text-blue-300 hover:underline"
              >
                <span>ไปที่คลังชาดก</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="md:col-span-8 space-y-4">
          {/* Bar 1: Active Collection Overall */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold text-[#1C1917] dark:text-[#F3F0E6]">
                คลังพร้อมอ่านทั้งหมดในระบบ
              </span>
              <span className="font-mono tabular-nums text-stone-600 dark:text-stone-300">
                {stats.collectionRead} / {stats.collectionTotal} เรื่อง (
                <strong className="text-[#1E3A8A] dark:text-blue-300">
                  {stats.collectionPercentRounded}%
                </strong>
                )
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="ความคืบหน้าการอ่านชาดกในคลังพร้อมอ่าน"
              aria-valuenow={stats.collectionRead}
              aria-valuemin={0}
              aria-valuemax={stats.collectionTotal}
              aria-valuetext={`อ่านแล้ว ${stats.collectionRead} จาก ${stats.collectionTotal} เรื่อง (${stats.collectionPercentRounded}%)`}
              className="h-2.5 w-full bg-[#EFEAE0] dark:bg-[#232732] border border-[#DFD7C5] dark:border-[#374151] rounded-full overflow-hidden"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 motion-reduce:transition-none ${
                  isCollectionComplete
                    ? 'bg-[#15803D] dark:bg-emerald-400'
                    : 'bg-[#1E3A8A] dark:bg-blue-400'
                }`}
                style={{
                  width: `${stats.collectionPercentExact}%`,
                  minWidth: stats.collectionRead > 0 ? '8px' : '0px',
                }}
              />
            </div>
          </div>

          {/* Bar 2 & 3: Sub-collections grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tosachat (10 tales) */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-stone-700 dark:text-stone-300">
                  ทศชาติชาดก (๑๐ พระชาติ)
                </span>
                <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                  {stats.tosachatRead}/{stats.tosachatTotal} · {stats.tosachatPercent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="ความคืบหน้าการอ่านทศชาติชาดก"
                aria-valuenow={stats.tosachatRead}
                aria-valuemin={0}
                aria-valuemax={stats.tosachatTotal}
                aria-valuetext={`ทศชาติชาดก อ่านแล้ว ${stats.tosachatRead} จาก ${stats.tosachatTotal} เรื่อง (${stats.tosachatPercent}%)`}
                className="h-2 w-full bg-[#EFEAE0] dark:bg-[#232732] rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-[#92400E] dark:bg-amber-400 rounded-full transition-all duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${stats.tosachatPercent}%`,
                    minWidth: stats.tosachatRead > 0 ? '6px' : '0px',
                  }}
                />
              </div>
            </div>

            {/* Nipata tales in library */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-stone-700 dark:text-stone-300">
                  นิบาตชาดกในคลัง
                </span>
                <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                  {stats.nipataRead}/{stats.nipataTotal} · {stats.nipataPercent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="ความคืบหน้าการอ่านนิบาตชาดกในคลัง"
                aria-valuenow={stats.nipataRead}
                aria-valuemin={0}
                aria-valuemax={stats.nipataTotal}
                aria-valuetext={`นิบาตชาดกในคลัง อ่านแล้ว ${stats.nipataRead} จาก ${stats.nipataTotal} เรื่อง (${stats.nipataPercent}%)`}
                className="h-2 w-full bg-[#EFEAE0] dark:bg-[#232732] rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-[#C89B54] dark:bg-amber-500 rounded-full transition-all duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${stats.nipataPercent}%`,
                    minWidth: stats.nipataRead > 0 ? '6px' : '0px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bar 4: Full 547 Tipitaka Canon */}
          <div className="pt-2 border-t border-[#EFEAE0] dark:border-[#2E3442] space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-stone-700 dark:text-stone-300">
                ความครอบคลุมคลังพระไตรปิฎกฉบับเต็ม (๕๔๗ เรื่อง)
              </span>
              <span className="font-mono tabular-nums text-stone-600 dark:text-stone-300">
                อ่านแล้ว {stats.canonRead} / {TOTAL_CANON_JATAKAS} เรื่อง ({stats.canonPercentLabel})
                {stats.unlockedUnreadCount > 0 && (
                  <span className="text-stone-500 dark:text-stone-400">
                    {' '}
                    · ปลดล็อกรออ่าน {stats.unlockedUnreadCount}
                  </span>
                )}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="ความคืบหน้าการอ่านจากคลังพระไตรปิฎกเต็ม 547 เรื่อง"
              aria-valuenow={stats.canonRead}
              aria-valuemin={0}
              aria-valuemax={TOTAL_CANON_JATAKAS}
              aria-valuetext={`อ่านแล้ว ${stats.canonRead} จาก ${TOTAL_CANON_JATAKAS} เรื่อง (${stats.canonPercentLabel})`}
              className="h-2 w-full bg-[#EFEAE0] dark:bg-[#232732] rounded-full overflow-hidden flex"
            >
              {stats.canonRead > 0 && (
                <div
                  className="h-full bg-[#1E3A8A] dark:bg-blue-400 transition-all duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${stats.canonPercentExact}%`,
                    minWidth: '6px',
                  }}
                />
              )}
              {stats.unlockedUnreadCount > 0 && (
                <div
                  className="h-full bg-[#C89B54]/75 dark:bg-amber-500/60 transition-all duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${(stats.unlockedUnreadCount / TOTAL_CANON_JATAKAS) * 100}%`,
                    minWidth: '4px',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
