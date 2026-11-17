import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Compass, HelpCircle, Loader2, Search, Star } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import {
  findNipataForNumber,
  NipataIndexEntry,
  NipataInfo,
  PREBUILT_BY_NUMBER,
  TIPITAKA_22_NIPATAS,
} from '../data/nipataCatalog';

interface Tipitaka547ExplorerProps {
  unlockedNumbers: number[];
  readNumbers?: number[];
  loadingNumber: number | null;
  errorMessage: string | null;
  onUnlockAndOpen: (
    jatakaNumber: number,
    targetMode: 'library' | 'interactive' | 'quiz',
    hint?: { thaiTitle?: string; paliTitle?: string; nipataName?: string }
  ) => void;
}

const INDEX_STORAGE_KEY = 'sala_jataka_nipata_index_v1';

export const Tipitaka547Explorer: React.FC<Tipitaka547ExplorerProps> = ({
  unlockedNumbers,
  readNumbers = [],
  loadingNumber,
  errorMessage,
  onUnlockAndOpen,
}) => {
  const { isFavorite, toggleFavorite } = useAppState();
  const [selectedNipata, setSelectedNipata] = useState<NipataInfo>(
    TIPITAKA_22_NIPATAS[0]
  );
  const [jumpInput, setJumpInput] = useState('');
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [indexCache, setIndexCache] = useState<
    Record<string, NipataIndexEntry[]>
  >(() => {
    try {
      const saved = localStorage.getItem(INDEX_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Record<string, NipataIndexEntry[]>) : {};
    } catch {
      return {};
    }
  });
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [cachedRanges, setCachedRanges] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/jataka/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { cachedNipataRanges?: string[] } | null) => {
        if (data?.cachedNipataRanges) {
          setCachedRanges(data.cachedNipataRanges);
        }
      })
      .catch(() => {
        // ignore status error
      });
  }, []);

  const subRanges = useMemo(() => {
    const ranges: Array<{ start: number; end: number }> = [];
    for (
      let s = selectedNipata.startNumber;
      s <= selectedNipata.endNumber;
      s += 25
    ) {
      ranges.push({
        start: s,
        end: Math.min(selectedNipata.endNumber, s + 24),
      });
    }
    return ranges;
  }, [selectedNipata]);

  useEffect(() => {
    setRangeStart(selectedNipata.startNumber);
  }, [selectedNipata]);

  const activeRange = useMemo(() => {
    return (
      subRanges.find((r) => r.start === rangeStart) ||
      subRanges[0] || {
        start: selectedNipata.startNumber,
        end: selectedNipata.endNumber,
      }
    );
  }, [subRanges, rangeStart, selectedNipata]);

  const rangeKey = `${activeRange.start}-${activeRange.end}`;
  const currentEntries = indexCache[rangeKey] || null;

  useEffect(() => {
    let cancelled = false;
    if (currentEntries) {
      setIndexError(null);
      return;
    }

    async function fetchRange() {
      setIsLoadingIndex(true);
      setIndexError(null);
      try {
        const res = await fetch('/api/jataka/nipata-index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nipataName: `${selectedNipata.thaiName} (${selectedNipata.paliName})`,
            startNo: activeRange.start,
            endNo: activeRange.end,
          }),
        });
        const data = (await res.json()) as {
          entries?: NipataIndexEntry[];
          error?: string;
          cachedRanges?: string[];
        };
        if (data.cachedRanges) {
          setCachedRanges(data.cachedRanges);
        }
        if (!res.ok || !data.entries) {
          throw new Error(data.error || 'ไม่สามารถโหลดรายชื่อชาดกได้');
        }
        if (cancelled) return;
        setCachedRanges((prev) =>
          prev.includes(rangeKey) ? prev : [...prev, rangeKey]
        );
        setIndexCache((prev) => {
          const next = { ...prev, [rangeKey]: data.entries! };
          try {
            localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore quota errors
          }
          return next;
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setIndexError(
            err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดสารบัญ'
          );
        }
      } finally {
        if (!cancelled) setIsLoadingIndex(false);
      }
    }

    void fetchRange();
    return () => {
      cancelled = true;
    };
  }, [
    rangeKey,
    currentEntries,
    selectedNipata.thaiName,
    selectedNipata.paliName,
    activeRange.start,
    activeRange.end,
  ]);

  const handleDirectJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(jumpInput.trim());
    if (!Number.isInteger(num) || num < 1 || num > 547) return;
    const nip = findNipataForNumber(num);
    onUnlockAndOpen(num, 'library', {
      nipataName: `${nip.thaiName} (${nip.paliName})`,
    });
  };

  const handleJumpToCachedRange = (rangeStr: string) => {
    const [startStr] = rangeStr.split('-');
    const startNum = Number(startStr);
    if (!Number.isInteger(startNum)) return;
    const nip = findNipataForNumber(startNum);
    setSelectedNipata(nip);
    setRangeStart(startNum);
    setIndexError(null);
  };

  return (
    <div className="space-y-6">
      {/* Direct Jump Bar (1-547) */}
      <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
            สารบัญพระไตรปิฎก ๕๔๗ เรื่อง (๒๒ นิบาต)
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            เลือกนิบาตหรือระบุเลขลำดับชาดกตั้งแต่ ๑ ถึง ๕๔๗ เพื่อเปิดอ่านเนื้อเรื่อง บทโต้ตอบ และข้อคิดครบทั้ง ๓ โหมด
          </p>
        </div>

        <form onSubmit={handleDirectJump} className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="number"
              min={1}
              max={547}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder="ลำดับที่ 1 - 547"
              className="w-40 pl-8 pr-3 py-2 text-xs font-mono tabular-nums bg-[#FAF8F3] dark:bg-[#111318] border border-[#D6CEBE] dark:border-[#374151] rounded-md text-[#1C1917] dark:text-[#F3F0E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]"
            />
          </div>
          <button
            type="submit"
            disabled={loadingNumber !== null || !jumpInput.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {loadingNumber !== null ? 'กำลังเรียบเรียง...' : 'เปิดชาดก'}
          </button>
        </form>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#FEF2F2] dark:bg-red-950/50 border border-[#FECACA] dark:border-red-900 rounded-lg text-sm text-[#991B1B] dark:text-red-200">
          {errorMessage}
        </div>
      )}

      {/* 22-Nipata Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-3 max-h-[560px] overflow-y-auto space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
            หมวดนิบาตในขุททกนิกาย (๒๒ หมวด)
          </div>
          {TIPITAKA_22_NIPATAS.map((nip) => {
            const isSelected = nip.nipataNumber === selectedNipata.nipataNumber;
            return (
              <button
                key={nip.nipataNumber}
                type="button"
                onClick={() => setSelectedNipata(nip)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                    : 'bg-transparent text-[#1C1917] dark:text-[#F3F0E6] border-transparent hover:bg-[#FAF8F3] dark:hover:bg-[#232732]'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {nip.nipataNumber}. {nip.thaiName}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      isSelected ? 'text-blue-100' : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {nip.verseCountLabel} · {nip.paliName}
                  </div>
                </div>
                <span
                  className={`text-xs font-mono tabular-nums shrink-0 ${
                    isSelected ? 'text-blue-100' : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {nip.startNumber}–{nip.endNumber}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Right Panel: Sub-ranges + Jataka Rows */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#E4DEC9] dark:border-[#2E3442] bg-[#FAF8F3] dark:bg-[#151820] space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                  นิบาตที่ {selectedNipata.nipataNumber}: {selectedNipata.thaiName}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  {selectedNipata.summary}
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-[#92400E] dark:text-amber-400 font-medium">
                ชาดกที่ {selectedNipata.startNumber}–{selectedNipata.endNumber}
              </span>
            </div>

            {subRanges.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {subRanges.map((r) => {
                  const isActive = r.start === activeRange.start;
                  return (
                    <button
                      key={r.start}
                      type="button"
                      onClick={() => setRangeStart(r.start)}
                      className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded border transition-colors ${
                        isActive
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                          : 'bg-white dark:bg-[#232732] text-stone-700 dark:text-stone-300 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342]'
                      }`}
                    >
                      {r.start}–{r.end}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Index List Body */}
          {isLoadingIndex ? (
            <div className="p-8 space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#1E3A8A] dark:text-blue-300 font-medium mb-4">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>
                  กำลังจัดเตรียมสารบัญพระไตรปิฎกลำดับที่ {activeRange.start}–
                  {activeRange.end}...
                </span>
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-[#FAF8F3] dark:bg-[#232732] border border-[#EFEAE0] dark:border-[#2E3442] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : indexError ? (
            <div className="p-8 text-center space-y-4">
              <p className="text-sm text-[#92400E] dark:text-amber-300 max-w-xl mx-auto leading-relaxed">
                {indexError}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIndexError(null);
                    setIndexCache((prev) => {
                      const next = { ...prev };
                      delete next[rangeKey];
                      return next;
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors"
                >
                  ลองโหลดสารบัญอีกครั้ง
                </button>
              </div>
              {cachedRanges.length > 0 && (
                <div className="pt-3 border-t border-[#EFEAE0] dark:border-[#2E3442] space-y-2">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    หมวดที่โหลดเก็บไว้แล้ว (เปิดดูได้ทันทีโดยไม่ต้องใช้โควตา AI):
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {cachedRanges.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleJumpToCachedRange(r)}
                        className="px-2.5 py-1 text-xs font-mono tabular-nums rounded border border-[#D6CEBE] dark:border-[#374151] bg-[#FAF8F3] dark:bg-[#232732] text-[#1C1917] dark:text-[#F3F0E6] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342] transition-colors"
                      >
                        ลำดับ {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#EFEAE0] dark:divide-[#2E3442]">
              {(currentEntries || []).map((entry) => {
                const isPrebuilt = Boolean(PREBUILT_BY_NUMBER[entry.number]);
                const rowTaleId =
                  PREBUILT_BY_NUMBER[entry.number] || `canon-${entry.number}`;
                const starred = isFavorite(rowTaleId);
                const isUnlocked =
                  isPrebuilt || unlockedNumbers.includes(entry.number);
                const isRead = readNumbers.includes(entry.number);
                const isLoadingThis = loadingNumber === entry.number;
                const hint = {
                  thaiTitle: entry.thaiTitle,
                  paliTitle: entry.paliTitle,
                  nipataName: `${selectedNipata.thaiName} (${selectedNipata.paliName})`,
                };

                return (
                  <div
                    key={entry.number}
                    className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F3]/70 dark:hover:bg-[#232732]/60 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span className="font-mono text-xs font-semibold tabular-nums text-[#92400E] dark:text-amber-400 mt-1 shrink-0 w-9">
                        #{String(entry.number).padStart(3, '0')}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                            {entry.thaiTitle}
                          </span>
                          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                            {entry.paliTitle}
                          </span>
                          {isRead && (
                            <span className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300">
                              · อ่านแล้ว
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                          {entry.theme} ·{' '}
                          <span className="text-stone-500 dark:text-stone-400">
                            {entry.baramiHint}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-12 sm:pl-0">
                      <button
                        type="button"
                        aria-pressed={starred}
                        onClick={() =>
                          void toggleFavorite({
                            taleId: rowTaleId,
                            jatakaNumber: entry.number,
                            title: entry.thaiTitle,
                            barami: entry.baramiHint || 'คุณธรรม',
                          })
                        }
                        aria-label={
                          starred
                            ? `นำ ${entry.thaiTitle} ออกจากรายการโปรด`
                            : `ติดดาว ${entry.thaiTitle} เป็นรายการโปรด`
                        }
                        title={starred ? 'นำออกจากรายการโปรด' : 'ติดดาวรายการโปรด'}
                        className={`p-1.5 rounded-md border transition-colors ${
                          starred
                            ? 'bg-[#FEF3C7] dark:bg-amber-900/50 text-[#B45309] dark:text-amber-300 border-[#E5C98B] dark:border-amber-700'
                            : 'bg-white dark:bg-[#232732] text-stone-400 hover:text-amber-500 border-[#D6CEBE] dark:border-[#374151]'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            starred ? 'fill-amber-400 text-amber-500 dark:text-amber-300' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      <button
                        type="button"
                        disabled={loadingNumber !== null}
                        onClick={() =>
                          onUnlockAndOpen(entry.number, 'library', hint)
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                          isUnlocked
                            ? 'bg-[#1E3A8A] text-white hover:bg-[#172D6E]'
                            : 'bg-[#F3EFE6] dark:bg-[#232732] text-[#1C1917] dark:text-[#F3F0E6] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342]'
                        } disabled:opacity-50`}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        {isLoadingThis
                          ? 'กำลังสร้าง...'
                          : isUnlocked
                          ? 'อ่านเรื่อง'
                          : 'สร้าง & อ่าน'}
                      </button>

                      <button
                        type="button"
                        disabled={loadingNumber !== null}
                        onClick={() =>
                          onUnlockAndOpen(entry.number, 'interactive', hint)
                        }
                        title="เล่นนิทานแบบโต้ตอบ"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
                        โต้ตอบ
                      </button>

                      <button
                        type="button"
                        disabled={loadingNumber !== null}
                        onClick={() =>
                          onUnlockAndOpen(entry.number, 'quiz', hint)
                        }
                        title="ทายข้อคิดจากชาดกเรื่องนี้"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-300" aria-hidden="true" />
                        ทายข้อคิด
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
