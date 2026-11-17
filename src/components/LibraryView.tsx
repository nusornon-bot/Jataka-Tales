import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Loader2,
  NotebookPen,
  Search,
  Sparkles,
  Square,
  Star,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import {
  getJatakaNumberByTaleId,
  PREBUILT_BY_NUMBER,
} from '../data/nipataCatalog';
import { getTaleGlossary, getTaleSamodhana } from '../data/samodhanaGlossary';
import { getJatakaSourceInfo } from '../utils/jatakaSource';
import {
  CollectionFilter,
  FontSizePreference,
  JatakaTale,
  SceneVisualSpec,
  VirtueCategory,
} from '../types/jataka';
import { NarrationSegment, useThaiSpeech } from '../utils/speech';
import { Tipitaka547Explorer } from './Tipitaka547Explorer';
import { AnimatedJatakaArtwork } from './AnimatedJatakaArtwork';
import { VoiceNarrationPlayer } from './VoiceNarrationPlayer';

const TOTAL_CANON_JATAKAS = 547;

const PROSE_SIZE_CLASSES: Record<FontSizePreference, string> = {
  sm: 'text-[15px] leading-[1.8]',
  md: 'text-[17px] leading-[1.85]',
  lg: 'text-[20px] leading-[1.95]',
};

function buildTaleNarrationSegments(tale: JatakaTale): NarrationSegment[] {
  return [
    {
      label: 'บทนำ',
      text: `${tale.title}. ${tale.summary}`,
    },
    ...tale.paragraphs.map((para, idx) => ({
      label: `ช่วงที่ ${idx + 1}`,
      text: para,
      paragraphIndex: idx,
    })),
    {
      label: 'ข้อคิดธรรม',
      text: `คติพจน์ประจำเรื่อง: ${tale.thaiVerseMeaning}. แก่นข้อคิดธรรม: ${tale.moralPoints.join(' ')}. การนำไปประยุกต์ใช้: ${tale.dailyApplication}`,
    },
  ];
}

interface LibraryViewProps {
  tales: JatakaTale[];
  selectedTaleId: string | null;
  onSelectTale: (taleId: string | null) => void;
  onStartInteractiveStory: (storyId: string) => void;
  activeSubTab: 'curated' | 'canon547';
  onChangeSubTab: (tab: 'curated' | 'canon547') => void;
  unlockedNumbers: number[];
  readNumbers: number[];
  onToggleReadNumber: (jatakaNumber: number) => void;
  loadingNumber: number | null;
  errorMessage: string | null;
  onUnlockAndOpen: (
    jatakaNumber: number,
    targetMode: 'library' | 'interactive' | 'quiz',
    hint?: { thaiTitle?: string; paliTitle?: string; nipataName?: string }
  ) => void;
  onUpdateTaleSceneVisual?: (jatakaNumber: number, sceneVisual: SceneVisualSpec) => void;
}

const CATEGORIES: VirtueCategory[] = [
  'ทั้งหมด',
  'ทานและเมตตา',
  'ศีลและเนกขัมมะ',
  'ความเพียรและอธิษฐาน',
  'ปัญญาและสติ',
  'ขันติ สัจจะ อุเบกขา',
];

export const LibraryView: React.FC<LibraryViewProps> = ({
  tales,
  selectedTaleId,
  onSelectTale,
  onStartInteractiveStory,
  activeSubTab,
  onChangeSubTab,
  unlockedNumbers,
  readNumbers,
  onToggleReadNumber,
  loadingNumber,
  errorMessage,
  onUnlockAndOpen,
  onUpdateTaleSceneVisual,
}) => {
  const {
    fontSize,
    favorites,
    isFavorite,
    toggleFavorite,
    notes,
    saveReflectionNote,
    deleteReflectionNote,
    user,
  } = useAppState();

  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
  const [category, setCategory] = useState<VirtueCategory>('ทั้งหมด');
  const [query, setQuery] = useState('');

  const [noteDraft, setNoteDraft] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [artworkBusy, setArtworkBusy] = useState(false);
  const [artworkError, setArtworkError] = useState<string | null>(null);

  const {
    isSupported,
    isSpeaking,
    isPaused,
    speakingId,
    rate,
    setRate,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    currentSegmentIndex,
    currentSegment,
    speakQueue,
    togglePause,
    stop,
    nextSegment,
    prevSegment,
    jumpToSegment,
  } = useThaiSpeech();

  const activeTale: JatakaTale | undefined = selectedTaleId
    ? tales.find((t) => t.id === selectedTaleId)
    : undefined;

  useEffect(() => {
    if (activeTale) {
      setNoteDraft(notes[activeTale.id]?.content || '');
      setNoteSavedToast(false);
      setArtworkError(null);
    }
  }, [activeTale?.id, notes]);

  const progressStats = useMemo(() => {
    const prebuiltNums = Object.keys(PREBUILT_BY_NUMBER).map(Number);
    const unlockedSet = new Set(
      [...prebuiltNums, ...unlockedNumbers].filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_CANON_JATAKAS
      )
    );
    const readSet = new Set(
      readNumbers.filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_CANON_JATAKAS
      )
    );
    const exploredSet = new Set([...unlockedSet, ...readSet]);

    const readCount = readSet.size;
    const unlockedCount = unlockedSet.size;
    const unlockedUnreadCount = Array.from(unlockedSet).filter(
      (n) => !readSet.has(n)
    ).length;
    const exploredCount = exploredSet.size;
    const remainingCount = Math.max(0, TOTAL_CANON_JATAKAS - exploredCount);

    const progressPercent = (exploredCount / TOTAL_CANON_JATAKAS) * 100;
    const progressPercentLabel =
      exploredCount >= TOTAL_CANON_JATAKAS
        ? '100%'
        : `${progressPercent.toFixed(1)}%`;

    const readPercentWidth = (readCount / TOTAL_CANON_JATAKAS) * 100;
    const unlockedUnreadPercentWidth =
      (unlockedUnreadCount / TOTAL_CANON_JATAKAS) * 100;

    return {
      readSet,
      readCount,
      unlockedCount,
      unlockedUnreadCount,
      exploredCount,
      remainingCount,
      progressPercentLabel,
      readPercentWidth,
      unlockedUnreadPercentWidth,
    };
  }, [unlockedNumbers, readNumbers]);

  const totalFavoritesCount = Object.keys(favorites).length;

  const filteredTales = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tales.filter((tale) => {
      const matchCollection =
        collectionFilter === 'all' ||
        (collectionFilter === 'favorites'
          ? Boolean(favorites[tale.id])
          : tale.collectionGroup === collectionFilter);
      const matchCat = category === 'ทั้งหมด' || tale.virtue === category;
      const matchQuery =
        q.length === 0 ||
        tale.title.toLowerCase().includes(q) ||
        tale.summary.toLowerCase().includes(q) ||
        tale.barami.toLowerCase().includes(q) ||
        tale.moralPoints.some((m) => m.toLowerCase().includes(q));
      return matchCollection && matchCat && matchQuery;
    });
  }, [tales, collectionFilter, category, query, favorites]);

  const pendingFavoriteRecords = useMemo(() => {
    if (collectionFilter !== 'favorites') return [];
    const loadedIds = new Set(tales.map((t) => t.id));
    const q = query.trim().toLowerCase();
    return Object.values(favorites)
      .filter((fav) => !loadedIds.has(fav.taleId))
      .filter(
        (fav) =>
          q.length === 0 ||
          fav.title.toLowerCase().includes(q) ||
          fav.barami.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [collectionFilter, tales, favorites, query]);

  if (activeTale) {
    const narrationSegments = buildTaleNarrationSegments(activeTale);
    const isReadingThis = isSpeaking && speakingId === activeTale.id;
    const activeTaleNumber = getJatakaNumberByTaleId(activeTale.id);
    const isActiveTaleRead =
      activeTaleNumber !== null && progressStats.readSet.has(activeTaleNumber);
    const activeSource = getJatakaSourceInfo(activeTale);
    const samodhanaList = getTaleSamodhana(activeTale);
    const glossaryList = getTaleGlossary(activeTale);
    const activeIsFavorite = isFavorite(activeTale.id);
    const isDynamicTale = activeTale.id.startsWith('canon-');

    const handleSaveNote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!noteDraft.trim() || savingNote) return;
      setSavingNote(true);
      try {
        await saveReflectionNote({
          taleId: activeTale.id,
          jatakaNumber: activeTaleNumber || 0,
          title: activeTale.title,
          content: noteDraft,
        });
        setNoteSavedToast(true);
        window.setTimeout(() => setNoteSavedToast(false), 2500);
      } finally {
        setSavingNote(false);
      }
    };

    const handleGenerateSceneArtwork = async () => {
      if (!activeTaleNumber || artworkBusy) return;
      setArtworkBusy(true);
      setArtworkError(null);
      try {
        const res = await fetch('/api/jataka/artwork', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jatakaNumber: activeTaleNumber,
            title: activeTale.title,
            summary: activeTale.summary,
          }),
        });
        const data = (await res.json()) as {
          sceneVisual?: SceneVisualSpec;
          error?: string;
        };
        if (!res.ok || !data.sceneVisual) {
          throw new Error(data.error || 'ไม่สามารถออกแบบฉากภาพประกอบได้');
        }
        onUpdateTaleSceneVisual?.(activeTaleNumber, data.sceneVisual);
      } catch (err: unknown) {
        setArtworkError(
          err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างภาพฉาก'
        );
      } finally {
        setArtworkBusy(false);
      }
    };

    return (
      <article className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E4DEC9] dark:border-[#2E3442]">
          <button
            type="button"
            onClick={() => {
              stop();
              onSelectTale(null);
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            กลับไปหน้าคลังนิทานชาดก
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              aria-pressed={activeIsFavorite}
              onClick={() =>
                void toggleFavorite({
                  taleId: activeTale.id,
                  jatakaNumber: activeTaleNumber || 0,
                  title: activeTale.title,
                  barami: activeTale.barami,
                })
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${
                activeIsFavorite
                  ? 'bg-[#FEF3C7] dark:bg-amber-900/50 text-[#92400E] dark:text-amber-200 border-[#E5C98B] dark:border-amber-700'
                  : 'bg-white dark:bg-[#1A1D24] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732]'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  activeIsFavorite
                    ? 'fill-amber-400 text-amber-500 dark:text-amber-300'
                    : ''
                }`}
                aria-hidden="true"
              />
              {activeIsFavorite ? 'ติดดาวแล้ว' : 'ติดดาวรายการโปรด'}
            </button>

            {activeTaleNumber !== null && (
              <button
                type="button"
                onClick={() => onToggleReadNumber(activeTaleNumber)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${
                  isActiveTaleRead
                    ? 'bg-[#F3EFE6] dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 border-[#C8D3EB] dark:border-blue-800'
                    : 'bg-white dark:bg-[#1A1D24] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                {isActiveTaleRead ? 'อ่านแล้ว' : 'บันทึกว่าอ่านแล้ว'}
              </button>
            )}

            {isSupported && (
              <button
                type="button"
                onClick={() =>
                  isReadingThis
                    ? stop()
                    : speakQueue(narrationSegments, activeTale.id, 0)
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  isReadingThis
                    ? 'bg-[#92400E] text-white'
                    : 'bg-white dark:bg-[#1A1D24] border border-[#D6CEBE] dark:border-[#374151] text-[#1C1917] dark:text-[#F3F0E6] hover:bg-[#F3EFE6] dark:hover:bg-[#232732]'
                }`}
              >
                {isReadingThis ? (
                  <>
                    <Square className="w-3.5 h-3.5" aria-hidden="true" />
                    หยุดฟังบรรยาย
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-300" aria-hidden="true" />
                    ฟังเสียงบรรยาย
                  </>
                )}
              </button>
            )}

            {activeTale.interactiveStoryId && (
              <button
                type="button"
                onClick={() => {
                  stop();
                  onStartInteractiveStory(activeTale.interactiveStoryId!);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors whitespace-nowrap"
              >
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                เล่นเรื่องนี้แบบโต้ตอบ
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Reading Column */}
          <div className="lg:col-span-7 space-y-6">
            <header className="space-y-3">
              <div className="text-xs text-stone-500 dark:text-stone-400">
                <span>เรื่องที่ {activeTale.indexLabel}</span>
                <span aria-hidden="true"> · </span>
                <span>{activeTale.collection}</span>
                <span aria-hidden="true"> · </span>
                <span>{activeTale.barami}</span>
                <span aria-hidden="true"> · </span>
                <span>เวลาอ่าน {activeTale.readTimeMinutes} นาที</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1917] dark:text-[#F3F0E6] leading-snug">
                {activeTale.title}
              </h1>
              <p className="text-sm font-mono text-stone-500 dark:text-stone-400">
                {activeTale.paliTitle}
              </p>
            </header>

            <figure className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-[#EFEAE0] dark:bg-[#142038] overflow-hidden">
                <AnimatedJatakaArtwork
                  src={activeTale.image}
                  alt={activeTale.title}
                  taleId={activeTale.id}
                  fallbackTitle={activeTale.title}
                  sceneVisual={activeTale.sceneVisual}
                />
              </div>
              <figcaption className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400 border-t border-[#E4DEC9] dark:border-[#2E3442] flex flex-wrap items-center justify-between gap-2">
                <span>{activeTale.imageCaption}</span>
                {isDynamicTale && activeTaleNumber && (
                  <button
                    type="button"
                    disabled={artworkBusy}
                    onClick={() => void handleGenerateSceneArtwork()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#1E3A8A] dark:text-amber-300 bg-[#F3EFE6] dark:bg-[#232732] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342] rounded transition-colors whitespace-nowrap"
                  >
                    {artworkBusy ? (
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                    )}
                    <span>
                      {activeTale.sceneVisual
                        ? 'จัดองค์ประกอบฉากใหม่'
                        : 'สร้างฉากภาพประกอบเฉพาะเรื่อง'}
                    </span>
                  </button>
                )}
              </figcaption>
            </figure>

            {artworkError && (
              <p className="text-xs text-red-700 dark:text-red-400">{artworkError}</p>
            )}

            <VoiceNarrationPlayer
              title={activeTale.title}
              isSupported={isSupported}
              isActive={isReadingThis}
              isPaused={isPaused}
              rate={rate}
              onChangeRate={setRate}
              voices={voices}
              selectedVoiceURI={selectedVoiceURI}
              onChangeVoice={setSelectedVoiceURI}
              segments={narrationSegments}
              currentSegmentIndex={currentSegmentIndex}
              onStart={() => speakQueue(narrationSegments, activeTale.id, 0)}
              onTogglePause={togglePause}
              onStop={stop}
              onPrevSegment={prevSegment}
              onNextSegment={nextSegment}
              onJumpToSegment={(idx) =>
                isReadingThis
                  ? jumpToSegment(idx)
                  : speakQueue(narrationSegments, activeTale.id, idx)
              }
            />

            <div
              className={`max-w-2xl space-y-4 text-[#292524] dark:text-stone-200 ${PROSE_SIZE_CLASSES[fontSize]}`}
            >
              {activeTale.paragraphs.map((para, idx) => {
                const isParaSpeaking =
                  isReadingThis && currentSegment?.paragraphIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`group rounded-lg transition-colors ${
                      isParaSpeaking
                        ? 'bg-[#F3EFE6] dark:bg-[#232732] border border-[#DFD7C5] dark:border-[#374151] px-4 py-3 -mx-4'
                        : 'py-0.5'
                    }`}
                  >
                    <p
                      className={
                        idx === 0
                          ? 'first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:text-[#92400E] dark:first-letter:text-amber-300 first-letter:mr-1.5'
                          : ''
                      }
                    >
                      {para}
                    </p>
                    {isSupported && (
                      <div className="mt-1.5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const segIdx = narrationSegments.findIndex(
                              (s) => s.paragraphIndex === idx
                            );
                            if (segIdx !== -1) {
                              if (isReadingThis) {
                                jumpToSegment(segIdx);
                              } else {
                                speakQueue(
                                  narrationSegments,
                                  activeTale.id,
                                  segIdx
                                );
                              }
                            }
                          }}
                          className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                            isParaSpeaking
                              ? 'text-[#1E3A8A] dark:text-blue-300'
                              : 'text-stone-400 hover:text-[#1E3A8A] dark:hover:text-blue-300'
                          }`}
                        >
                          <Volume2 className="w-3 h-3" aria-hidden="true" />
                          <span>
                            {isParaSpeaking
                              ? 'กำลังบรรยายช่วงนี้'
                              : `ฟังตั้งแต่ช่วงที่ ${idx + 1}`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Samodhana & Glossary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E4DEC9] dark:border-[#2E3442]">
              <section className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-5 space-y-3">
                <h2 className="font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                  การประชุมชาดก (สโมธาน)
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  เชื่อมโยงตัวละครในอดีตชาติสู่บุคคลในสมัยพุทธกาล
                </p>
                <dl className="divide-y divide-[#EFEAE0] dark:divide-[#2E3442] text-xs">
                  {samodhanaList.map((row, i) => (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                      <dt className="text-stone-600 dark:text-stone-400">
                        {row.pastCharacter}
                      </dt>
                      <dd className="font-semibold text-[#1E3A8A] dark:text-blue-300">
                        กลับชาติมาเป็น: {row.presentIdentity}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-5 space-y-3">
                <h2 className="font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                  ศัพทานุกรมชาดกและคำสำคัญ
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  คำอธิบายศัพท์บาลีและถ้อยคำวรรณกรรมธรรมะในเรื่อง
                </p>
                <dl className="divide-y divide-[#EFEAE0] dark:divide-[#2E3442] text-xs">
                  {glossaryList.map((g, i) => (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                      <dt className="font-semibold text-[#92400E] dark:text-amber-300">
                        {g.term}
                      </dt>
                      <dd className="text-stone-700 dark:text-stone-300 leading-relaxed">
                        {g.meaning}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </div>

          {/* Margin Dhamma, Source & Personal Reflection Notes */}
          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 space-y-4">
              <div className="text-xs font-semibold text-[#92400E] dark:text-amber-400">
                คาถาธรรมบทและคติพจน์ประจำเรื่อง
              </div>
              <p className="font-serif text-lg font-semibold text-[#1C1917] dark:text-[#F3F0E6] leading-relaxed">
                “{activeTale.thaiVerseMeaning}”
              </p>
              <p className="text-xs font-mono text-stone-500 dark:text-stone-400 pt-2 border-t border-[#EFEAE0] dark:border-[#2E3442]">
                {activeTale.paliVerse}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                แก่นข้อคิดธรรมจากชาดก
              </h2>
              <ul className="space-y-3 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {activeTale.moralPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[#1E3A8A] dark:text-blue-300 mt-1 shrink-0 tabular-nums">
                      0{i + 1}.
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#F3EFE6] dark:bg-[#151820] border border-[#DFD7C5] dark:border-[#2E3442] rounded-xl p-6 space-y-2.5">
              <h2 className="font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                การนำไปประยุกต์ใช้ในชีวิตประจำวัน
              </h2>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {activeTale.dailyApplication}
              </p>
            </div>

            {/* Personal Reflection Note Box */}
            <form
              onSubmit={(e) => void handleSaveNote(e)}
              className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-1.5 font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                  <NotebookPen className="w-4 h-4 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
                  <span>สมุดบันทึกข้อคิดส่วนตัว</span>
                </h2>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  {user ? 'ซิงก์คลาวด์อัตโนมัติ' : 'บันทึกบนอุปกรณ์'}
                </span>
              </div>

              <textarea
                rows={3}
                maxLength={2000}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="จดบันทึกข้อคิดที่ประทับใจหรือสิ่งที่จะนำไปปรับใช้จากชาดกเรื่องนี้..."
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] dark:bg-[#111318] border border-[#D6CEBE] dark:border-[#374151] rounded-md text-[#1C1917] dark:text-[#F3F0E6] placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={savingNote || !noteDraft.trim()}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] disabled:opacity-50 rounded-md transition-colors"
                  >
                    {savingNote ? 'กำลังบันทึก...' : 'บันทึกข้อคิด'}
                  </button>
                  {notes[activeTale.id] && (
                    <button
                      type="button"
                      onClick={() => {
                        setNoteDraft('');
                        void deleteReflectionNote(activeTale.id);
                      }}
                      title="ลบบันทึกนี้"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ลบ
                    </button>
                  )}
                </div>
                {noteSavedToast && (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    บันทึกแล้ว
                  </span>
                )}
              </div>
            </form>

            <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 space-y-3">
              <h2 className="font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                ที่มาและแหล่งอ้างอิงในพระคัมภีร์
              </h2>
              <dl className="divide-y divide-[#EFEAE0] dark:divide-[#2E3442] text-xs leading-relaxed">
                <div className="py-2 first:pt-0 space-y-0.5">
                  <dt className="font-semibold text-stone-500 dark:text-stone-400">
                    พระไตรปิฎก
                  </dt>
                  <dd className="text-[#1C1917] dark:text-[#F3F0E6]">
                    {activeSource.pitakaText}
                  </dd>
                </div>
                <div className="py-2 space-y-0.5">
                  <dt className="font-semibold text-stone-500 dark:text-stone-400">
                    หมวดนิบาตและลำดับ
                  </dt>
                  <dd className="text-[#1C1917] dark:text-[#F3F0E6]">
                    {activeSource.nipataAndOrder}
                  </dd>
                </div>
                <div className="py-2 space-y-0.5">
                  <dt className="font-semibold text-stone-500 dark:text-stone-400">
                    คัมภีร์อรรถกถา
                  </dt>
                  <dd className="text-[#1C1917] dark:text-[#F3F0E6]">
                    {activeSource.commentaryText}
                  </dd>
                </div>
                {activeSource.presentContext && (
                  <div className="py-2 space-y-0.5">
                    <dt className="font-semibold text-stone-500 dark:text-stone-400">
                      ปฐมเหตุ (ปัจจุบันวัตถุ)
                    </dt>
                    <dd className="text-stone-700 dark:text-stone-300">
                      {activeSource.presentContext}
                    </dd>
                  </div>
                )}
                <div className="pt-2 text-stone-500 dark:text-stone-400">
                  เทียบเคียงเนื้อหาจากพระไตรปิฎกบาลีฉบับสยามรัฐและฉบับมหาจุฬาลงกรณราชวิทยาลัย (มจร.)
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4DEC9] dark:border-[#2E3442]">
        <div className="space-y-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            <span>โหมดที่ 1</span>
            <span aria-hidden="true"> · </span>
            <span>คลังนิทานชาดกและสารบัญพระไตรปิฎก ๕๔๗ เรื่อง</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
            คลังนิทานชาดกฉบับสมบูรณ์
          </h1>

          {/* Library View Switcher: Curated vs Full 547 Canon */}
          <div className="inline-flex flex-wrap sm:flex-nowrap max-w-full items-center p-1 bg-[#EFEAE0] dark:bg-[#1A1D24] border border-[#DFD7C5] dark:border-[#2E3442] rounded-lg gap-1">
            <button
              type="button"
              onClick={() => onChangeSubTab('curated')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'curated'
                  ? 'bg-white dark:bg-[#232732] text-[#1C1917] dark:text-[#F3F0E6] shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-[#1C1917] dark:hover:text-white'
              }`}
            >
              เรื่องที่พร้อมอ่าน ({tales.length})
            </button>
            <button
              type="button"
              onClick={() => onChangeSubTab('canon547')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'canon547'
                  ? 'bg-white dark:bg-[#232732] text-[#1C1917] dark:text-[#F3F0E6] shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-[#1C1917] dark:hover:text-white'
              }`}
            >
              สารบัญ ๕๔๗ เรื่อง (๒๒ นิบาต)
            </button>
          </div>
        </div>

        {activeSubTab === 'curated' && (
          <div className="relative w-full md:w-72">
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อชาดก หรือข้อคิด..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#1A1D24] border border-[#D6CEBE] dark:border-[#374151] rounded-md text-[#1C1917] dark:text-[#F3F0E6] placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]"
            />
          </div>
        )}
      </div>

      {/* 547 Jataka Tales Progress Indicator */}
      <section
        aria-label="ความคืบหน้าการอ่านและปลดล็อกชาดก 547 เรื่อง"
        className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-5 space-y-3.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              ความคืบหน้าคลังชาดก ๕๔๗ เรื่อง
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              <span>อ่านแล้ว {progressStats.readCount} เรื่อง</span>
              <span aria-hidden="true"> · </span>
              <span>ปลดล็อกพร้อมอ่าน {progressStats.unlockedCount} เรื่อง</span>
              <span aria-hidden="true"> · </span>
              <span>คงเหลือ {progressStats.remainingCount} เรื่อง</span>
            </p>
          </div>

          <div className="flex items-baseline gap-2.5 shrink-0">
            <span className="text-sm font-mono tabular-nums text-stone-700 dark:text-stone-300">
              {progressStats.exploredCount} / {TOTAL_CANON_JATAKAS} เรื่อง
            </span>
            <span className="text-xl font-serif font-bold tabular-nums text-[#1E3A8A] dark:text-blue-300">
              {progressStats.progressPercentLabel}
            </span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label="ความคืบหน้าการอ่านและปลดล็อกชาดกจากทั้งหมด 547 เรื่อง"
          aria-valuenow={progressStats.exploredCount}
          aria-valuemin={0}
          aria-valuemax={TOTAL_CANON_JATAKAS}
          aria-valuetext={`อ่านหรือปลดล็อกแล้ว ${progressStats.exploredCount} จาก ${TOTAL_CANON_JATAKAS} เรื่อง (${progressStats.progressPercentLabel})`}
          className="h-3 w-full bg-[#EFEAE0] dark:bg-[#232732] border border-[#DFD7C5] dark:border-[#374151] rounded-full overflow-hidden flex"
        >
          {progressStats.readCount > 0 && (
            <div
              className="h-full bg-[#1E3A8A] dark:bg-blue-400 transition-all duration-300"
              style={{
                width: `${progressStats.readPercentWidth}%`,
                minWidth: '6px',
              }}
            />
          )}
          {progressStats.unlockedUnreadCount > 0 && (
            <div
              className="h-full bg-[#C89B54] transition-all duration-300"
              style={{
                width: `${progressStats.unlockedUnreadPercentWidth}%`,
                minWidth: '6px',
              }}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs bg-[#1E3A8A] dark:bg-blue-400 shrink-0"
                aria-hidden="true"
              />
              <span>อ่านแล้ว ({progressStats.readCount})</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs bg-[#C89B54] shrink-0"
                aria-hidden="true"
              />
              <span>ปลดล็อกรออ่าน ({progressStats.unlockedUnreadCount})</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs bg-[#EFEAE0] dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] shrink-0"
                aria-hidden="true"
              />
              <span>ยังไม่ปลดล็อก ({progressStats.remainingCount})</span>
            </span>
          </div>

          {activeSubTab === 'curated' && (
            <button
              type="button"
              onClick={() => onChangeSubTab('canon547')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
            >
              <span>สำรวจสารบัญ ๕๔๗ เรื่องเพื่อปลดล็อกเพิ่ม</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {activeSubTab === 'canon547' ? (
        <Tipitaka547Explorer
          unlockedNumbers={unlockedNumbers}
          readNumbers={readNumbers}
          loadingNumber={loadingNumber}
          errorMessage={errorMessage}
          onUnlockAndOpen={onUnlockAndOpen}
        />
      ) : (
        <>
          {/* Interactive Filter Tabs */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex flex-wrap items-center p-1 bg-[#EFEAE0] dark:bg-[#1A1D24] border border-[#DFD7C5] dark:border-[#2E3442] rounded-lg gap-0.5">
                {(
                  [
                    { id: 'all', label: `ทั้งหมด (${tales.length})` },
                    {
                      id: 'tosachat',
                      label: `ทศชาติชาดก (${tales.filter((t) => t.collectionGroup === 'tosachat').length})`,
                    },
                    {
                      id: 'nipata',
                      label: `นิบาตชาดก (${tales.filter((t) => t.collectionGroup === 'nipata').length})`,
                    },
                    {
                      id: 'favorites',
                      label: `รายการโปรด (${totalFavoritesCount})`,
                    },
                  ] as const
                ).map((col) => {
                  const active = collectionFilter === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setCollectionFilter(col.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white dark:bg-[#232732] text-[#1C1917] dark:text-[#F3F0E6] shadow-xs font-semibold'
                          : 'text-stone-600 dark:text-stone-400 hover:text-[#1C1917] dark:hover:text-white'
                      }`}
                    >
                      {col.id === 'favorites' && (
                        <Star
                          className={`w-3.5 h-3.5 ${
                            active || totalFavoritesCount > 0
                              ? 'fill-amber-400 text-amber-500 dark:text-amber-300'
                              : ''
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      <span>{col.label}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                แสดง {filteredTales.length + pendingFavoriteRecords.length} จาก {tales.length} เรื่อง
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                        : 'bg-white dark:bg-[#1A1D24] text-stone-700 dark:text-stone-300 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredTales.length === 0 && pendingFavoriteRecords.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-10 text-center space-y-3">
              <p className="text-base font-medium text-[#1C1917] dark:text-[#F3F0E6]">
                {collectionFilter === 'favorites'
                  ? 'ยังไม่มีนิทานชาดกในรายการโปรด กดปุ่มรูปดาวบนการ์ดนิทานหรือในสารบัญ ๕๔๗ เรื่องเพื่อบันทึกเรื่องที่ชื่นชอบ'
                  : 'ไม่พบเรื่องชาดกที่ตรงกับเงื่อนไขการค้นหา'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCollectionFilter('all');
                  setCategory('ทั้งหมด');
                  setQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-md hover:bg-[#172D6E]"
              >
                แสดงนิทานชาดกทั้งหมด
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredTales.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTales.map((tale) => {
                    const taleNum = getJatakaNumberByTaleId(tale.id);
                    const starred = isFavorite(tale.id);
                    const hasNote = Boolean(notes[tale.id]);
                    return (
                      <article
                        key={tale.id}
                        className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          <div className="aspect-[4/3] bg-[#EFEAE0] dark:bg-[#142038] overflow-hidden relative">
                            <AnimatedJatakaArtwork
                              src={tale.image}
                              alt={tale.title}
                              taleId={tale.id}
                              fallbackTitle={tale.title}
                              sceneVisual={tale.sceneVisual}
                              compact
                            />
                            <button
                              type="button"
                              aria-pressed={starred}
                              onClick={() =>
                                void toggleFavorite({
                                  taleId: tale.id,
                                  jatakaNumber: taleNum || 0,
                                  title: tale.title,
                                  barami: tale.barami,
                                })
                              }
                              aria-label={
                                starred
                                  ? `นำ ${tale.title} ออกจากรายการโปรด`
                                  : `ติดดาว ${tale.title} เป็นรายการโปรด`
                              }
                              title={starred ? 'นำออกจากรายการโปรด' : 'ติดดาวรายการโปรด'}
                              className={`absolute top-2.5 right-2.5 p-2 rounded-md backdrop-blur-xs border transition-colors ${
                                starred
                                  ? 'bg-[#FEF3C7]/95 dark:bg-amber-900/90 text-[#B45309] dark:text-amber-200 border-[#E5C98B] dark:border-amber-400/50 shadow-xs'
                                  : 'bg-black/45 text-white/90 border-white/20 hover:bg-black/65'
                              }`}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  starred
                                    ? 'fill-amber-400 text-amber-500 dark:text-amber-300'
                                    : ''
                                }`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>

                          <div className="p-5 space-y-3">
                            <div className="text-xs text-stone-500 dark:text-stone-400">
                              <span>{tale.collection}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{tale.barami}</span>
                              <span aria-hidden="true"> · </span>
                              <span>อ่าน {tale.readTimeMinutes} นาที</span>
                              {starred && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span className="font-medium text-[#B45309] dark:text-amber-300">
                                    รายการโปรด
                                  </span>
                                </>
                              )}
                              {taleNum !== null && progressStats.readSet.has(taleNum) && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span className="font-medium text-[#1E3A8A] dark:text-blue-300">
                                    อ่านแล้ว
                                  </span>
                                </>
                              )}
                              {hasNote && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span className="font-medium text-[#92400E] dark:text-amber-400">
                                    มีบันทึก
                                  </span>
                                </>
                              )}
                            </div>

                        <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                          {tale.indexLabel}. {tale.title}
                        </h2>

                        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                          {tale.summary}
                        </p>

                        <div className="pt-2 border-t border-[#EFEAE0] dark:border-[#2E3442] space-y-1.5">
                          <p className="text-xs text-[#92400E] dark:text-amber-400">
                            ข้อคิดหลัก: {tale.moralPoints[0]}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            ที่มา: {getJatakaSourceInfo(tale).shortCitation}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          stop();
                          onSelectTale(tale.id);
                        }}
                        className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors whitespace-nowrap"
                      >
                        อ่านเรื่องเต็ม
                      </button>
                      {isSupported && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isSpeaking && speakingId === tale.id) {
                              stop();
                            } else {
                              speakQueue(buildTaleNarrationSegments(tale), tale.id, 0);
                            }
                          }}
                          aria-label={
                            isSpeaking && speakingId === tale.id
                              ? `หยุดฟังเรื่อง ${tale.title}`
                              : `ฟังเสียงบรรยายเรื่อง ${tale.title}`
                          }
                          className={`inline-flex items-center gap-1 py-2 px-2.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${
                            isSpeaking && speakingId === tale.id
                              ? 'bg-[#92400E] text-white border-[#92400E]'
                              : 'bg-white dark:bg-[#232732] text-[#1E3A8A] dark:text-blue-300 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#2D3342]'
                          }`}
                        >
                          {isSpeaking && speakingId === tale.id ? (
                            <>
                              <Square className="w-3 h-3" aria-hidden="true" />
                              <span>หยุด</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>ฟัง</span>
                            </>
                          )}
                        </button>
                      )}
                      {tale.interactiveStoryId && (
                        <button
                          type="button"
                          onClick={() => {
                            stop();
                            onStartInteractiveStory(tale.interactiveStoryId!);
                          }}
                          className="py-2 px-2.5 text-xs font-semibold text-[#1C1917] dark:text-[#F3F0E6] bg-[#F3EFE6] dark:bg-[#232732] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap"
                        >
                          โต้ตอบ
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
              )}

              {pendingFavoriteRecords.length > 0 && (
                <section className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-base font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                      รายการโปรดจากสารบัญ ๕๔๗ เรื่อง ({pendingFavoriteRecords.length})
                    </h2>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      กดสร้าง & อ่าน เพื่อเปิดเนื้อเรื่องเต็มลงในคลัง
                    </span>
                  </div>
                  <div className="divide-y divide-[#EFEAE0] dark:divide-[#2E3442]">
                    {pendingFavoriteRecords.map((fav) => (
                      <div
                        key={fav.taleId}
                        className="py-3 first:pt-1 last:pb-1 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs font-semibold tabular-nums text-[#92400E] dark:text-amber-400">
                            #{String(fav.jatakaNumber).padStart(3, '0')}
                          </span>
                          <div className="min-w-0">
                            <div className="font-serif text-sm font-bold text-[#1C1917] dark:text-[#F3F0E6] truncate">
                              {fav.title}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-stone-400">
                              {fav.barami}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={loadingNumber !== null}
                            onClick={() =>
                              onUnlockAndOpen(fav.jatakaNumber, 'library', {
                                thaiTitle: fav.title,
                              })
                            }
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] disabled:opacity-50 rounded-md transition-colors"
                          >
                            {loadingNumber === fav.jatakaNumber
                              ? 'กำลังสร้าง...'
                              : 'สร้าง & อ่าน'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void toggleFavorite({
                                taleId: fav.taleId,
                                jatakaNumber: fav.jatakaNumber,
                                title: fav.title,
                                barami: fav.barami,
                              })
                            }
                            aria-label={`นำ ${fav.title} ออกจากรายการโปรด`}
                            className="p-1.5 text-amber-500 hover:bg-[#FAF8F3] dark:hover:bg-[#232732] rounded-md border border-[#E5C98B] dark:border-amber-700/60 transition-colors"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
