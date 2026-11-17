import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { JatakaTale } from '../types/jataka';
import { computeBaramiMastery } from '../utils/baramiMastery';

interface TenBaramiTrackerProps {
  tales: JatakaTale[];
  onOpenTale: (taleId: string) => void;
  onStartInteractiveStory: (storyId: string) => void;
}

export const TenBaramiTracker: React.FC<TenBaramiTrackerProps> = ({
  tales,
  onOpenTale,
  onStartInteractiveStory,
}) => {
  const { readNumbers, completedInteractiveIds, bestQuizScore } = useAppState();
  const [expanded, setExpanded] = useState(false);

  const mastery = useMemo(
    () =>
      computeBaramiMastery({
        tales,
        readNumbers,
        completedInteractiveIds,
        bestQuizScore,
      }),
    [tales, readNumbers, completedInteractiveIds, bestQuizScore]
  );

  const visibleItems = expanded ? mastery.items : mastery.items.slice(0, 5);

  return (
    <section
      aria-label="แผนผังความเชี่ยวชาญทศบารมี 10 ประการ"
      className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 bg-[#FAF8F3] dark:bg-[#151820] border-b border-[#E4DEC9] dark:border-[#2E3442] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs text-[#92400E] dark:text-amber-400 font-semibold">
            <span>แผนผังการบำเพ็ญทศบารมี ๑๐ ประการ</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              เชี่ยวชาญแล้ว {mastery.masteredCount} / 10 บารมี
            </span>
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
            เส้นทางแห่งทศชาติชาดกและความเข้าใจหลักธรรม
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-stone-500 dark:text-stone-400">
              คะแนนรวมทศบารมี
            </div>
            <div className="text-xl font-serif font-bold font-mono tabular-nums text-[#1E3A8A] dark:text-blue-300">
              {mastery.overallPercent}%
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap"
          >
            <span>{expanded ? 'ย่อมุมมอง' : 'ดูครบทั้ง ๑๐ บารมี'}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-lg border flex flex-col justify-between gap-3 transition-colors ${
                item.isMastered
                  ? 'bg-[#ECFDF5]/60 dark:bg-emerald-950/25 border-[#A7F3D0] dark:border-emerald-800/60'
                  : 'bg-[#FAF8F3] dark:bg-[#151820] border-[#E4DEC9] dark:border-[#2E3442]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1 text-xs">
                  <span className="font-mono tabular-nums text-[#92400E] dark:text-amber-400 font-semibold">
                    {String(item.order).padStart(2, '0')}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-[#1E3A8A] dark:text-blue-300">
                    {item.isMastered && (
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    )}
                    {item.percent}%
                  </span>
                </div>

                <h3 className="font-serif text-sm font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                  {item.name}
                </h3>
                <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  {item.paliName}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2">
                  {item.shortDesc}
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-1.5 w-full bg-[#EFEAE0] dark:bg-[#232732] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.isMastered
                        ? 'bg-[#15803D] dark:bg-emerald-400'
                        : 'bg-[#1E3A8A] dark:bg-blue-400'
                    }`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenTale(item.tosachatTaleId)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E3A8A] dark:text-blue-300 hover:underline truncate"
                  >
                    <span>{item.tosachatTitle}</span>
                    <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onStartInteractiveStory(`interactive-${item.tosachatTaleId}`)
                    }
                    title={`เล่นโต้ตอบเรื่อง ${item.tosachatTitle}`}
                    aria-label={`เล่นโต้ตอบเรื่อง ${item.tosachatTitle}`}
                    className="p-1 text-[#92400E] dark:text-amber-400 hover:bg-[#EFEAE0] dark:hover:bg-[#232732] rounded transition-colors shrink-0"
                  >
                    <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          ความเชี่ยวชาญแต่ละบารมีคำนวณจากการอ่านชาดกประจำบารมี การเล่นโหมดโต้ตอบจนจบบริบูรณ์ และผลคะแนนแบบทดสอบทายข้อคิด
        </p>
      </div>
    </section>
  );
};
