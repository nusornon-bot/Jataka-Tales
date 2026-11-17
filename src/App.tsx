import { useEffect, useMemo, useState } from 'react';
import { TopBar } from './components/TopBar';
import { HomeGateway } from './components/HomeGateway';
import { LibraryView } from './components/LibraryView';
import { InteractiveStoryView } from './components/InteractiveStoryView';
import { QuizGameView } from './components/QuizGameView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAppState } from './contexts/AppStateContext';
import {
  HERO_ARTWORK,
  INTERACTIVE_STORIES,
  JATAKA_TALES,
  QUIZ_QUESTIONS,
} from './data/jatakaData';
import { getJatakaNumberByTaleId, PREBUILT_BY_NUMBER } from './data/nipataCatalog';
import {
  AppMode,
  InteractiveStory,
  JatakaTale,
  QuizQuestion,
  SceneVisualSpec,
} from './types/jataka';

const BUNDLES_STORAGE_KEY = 'sala_jataka_dynamic_bundles_v1';

interface DynamicBundle {
  jatakaNumber: number;
  tale: Omit<JatakaTale, 'image' | 'collectionGroup' | 'interactiveStoryId'>;
  interactive: Omit<InteractiveStory, 'image'>;
  quiz: QuizQuestion[];
}

export default function App() {
  const {
    readNumbers,
    markNumberAsRead,
    toggleReadNumber,
    syncedUnlockedNumbers,
    recordUnlockedNumber,
    markInteractiveCompleted,
    bestQuizScore,
    recordQuizScore,
  } = useAppState();

  const [activeMode, setActiveMode] = useState<AppMode>('home');
  const [librarySubTab, setLibrarySubTab] = useState<'curated' | 'canon547'>(
    'curated'
  );
  const [selectedTaleId, setSelectedTaleId] = useState<string | null>(null);
  const [activeInteractiveId, setActiveInteractiveId] = useState<string>(
    'interactive-temiya'
  );
  const [quizFocusTaleTitle, setQuizFocusTaleTitle] = useState<string | null>(
    null
  );
  const [loadingNumber, setLoadingNumber] = useState<number | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [serverCachedNumbers, setServerCachedNumbers] = useState<number[]>([]);

  const [dynamicBundles, setDynamicBundles] = useState<
    Record<number, DynamicBundle>
  >(() => {
    try {
      const saved = localStorage.getItem(BUNDLES_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Record<number, DynamicBundle>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    fetch('/api/jataka/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { cachedNumbers?: number[] } | null) => {
        if (data?.cachedNumbers) {
          setServerCachedNumbers(data.cachedNumbers);
        }
      })
      .catch(() => {
        // Ignore status check error
      });
  }, []);

  const allTales = useMemo<JatakaTale[]>(() => {
    const extras: JatakaTale[] = Object.values(dynamicBundles).map((b) => ({
      ...b.tale,
      collectionGroup: 'nipata',
      image: HERO_ARTWORK,
      interactiveStoryId: b.interactive.id,
    }));
    return [...JATAKA_TALES, ...extras];
  }, [dynamicBundles]);

  const allInteractiveStories = useMemo<InteractiveStory[]>(() => {
    const extras: InteractiveStory[] = Object.values(dynamicBundles).map((b) => ({
      ...b.interactive,
      image: HERO_ARTWORK,
    }));
    return [...INTERACTIVE_STORIES, ...extras];
  }, [dynamicBundles]);

  const allQuizQuestions = useMemo<QuizQuestion[]>(() => {
    const extras: QuizQuestion[] = Object.values(dynamicBundles).flatMap(
      (b) => b.quiz
    );
    return [...QUIZ_QUESTIONS, ...extras];
  }, [dynamicBundles]);

  const unlockedNumbers = useMemo(() => {
    const clientNums = Object.keys(dynamicBundles).map(Number);
    return Array.from(
      new Set([...serverCachedNumbers, ...clientNums, ...syncedUnlockedNumbers])
    );
  }, [dynamicBundles, serverCachedNumbers, syncedUnlockedNumbers]);

  const handleSelectMode = (mode: AppMode) => {
    setActiveMode(mode);
    if (mode !== 'library') {
      setSelectedTaleId(null);
    }
    if (mode !== 'quiz') {
      setQuizFocusTaleTitle(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpen547Catalog = () => {
    setSelectedTaleId(null);
    setLibrarySubTab('canon547');
    setActiveMode('library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTaleInLibrary = (taleId: string | null) => {
    setSelectedTaleId(taleId);
    if (taleId) {
      const num = getJatakaNumberByTaleId(taleId);
      if (num) markNumberAsRead(num);
    }
  };

  const handleOpenTale = (taleId: string) => {
    handleSelectTaleInLibrary(taleId);
    setLibrarySubTab('curated');
    setActiveMode('library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartInteractiveStory = (storyId: string) => {
    setActiveInteractiveId(storyId);
    setActiveMode('interactive');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateTaleSceneVisual = (
    jatakaNumber: number,
    sceneVisual: SceneVisualSpec
  ) => {
    setDynamicBundles((prev) => {
      const target = prev[jatakaNumber];
      if (!target) return prev;
      const next: Record<number, DynamicBundle> = {
        ...prev,
        [jatakaNumber]: {
          ...target,
          tale: {
            ...target.tale,
            sceneVisual,
          },
        },
      };
      try {
        localStorage.setItem(BUNDLES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota
      }
      return next;
    });
  };

  const handleUnlockAndOpen = async (
    jatakaNumber: number,
    targetMode: 'library' | 'interactive' | 'quiz',
    hint?: { thaiTitle?: string; paliTitle?: string; nipataName?: string }
  ) => {
    setUnlockError(null);

    // 1. Check prebuilt illustrated tales first
    const prebuiltId = PREBUILT_BY_NUMBER[jatakaNumber];
    if (prebuiltId) {
      const prebuiltTale = JATAKA_TALES.find((t) => t.id === prebuiltId);
      if (prebuiltTale) {
        if (targetMode === 'library') {
          handleOpenTale(prebuiltTale.id);
          return;
        }
        if (targetMode === 'interactive' && prebuiltTale.interactiveStoryId) {
          handleStartInteractiveStory(prebuiltTale.interactiveStoryId);
          return;
        }
        if (targetMode === 'quiz') {
          setQuizFocusTaleTitle(prebuiltTale.title);
          setActiveMode('quiz');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    // 2. Check already unlocked client cache
    let bundle = dynamicBundles[jatakaNumber];
    if (!bundle) {
      setLoadingNumber(jatakaNumber);
      try {
        const res = await fetch('/api/jataka/bundle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jatakaNumber,
            thaiTitle: hint?.thaiTitle,
            paliTitle: hint?.paliTitle,
            nipataName: hint?.nipataName,
          }),
        });
        const data = (await res.json()) as {
          bundle?: DynamicBundle;
          error?: string;
        };
        if (!res.ok || !data.bundle) {
          throw new Error(data.error || 'ไม่สามารถเรียบเรียงชาดกเรื่องนี้ได้');
        }
        bundle = data.bundle;
        setDynamicBundles((prev) => {
          const next = { ...prev, [jatakaNumber]: bundle! };
          try {
            localStorage.setItem(BUNDLES_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore storage quota
          }
          return next;
        });
      } catch (err: unknown) {
        setUnlockError(
          err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างข้อมูลชาดก'
        );
        setLoadingNumber(null);
        return;
      } finally {
        setLoadingNumber(null);
      }
    }

    recordUnlockedNumber(jatakaNumber);

    // 3. Navigate to requested mode
    if (targetMode === 'library') {
      handleOpenTale(bundle.tale.id);
    } else if (targetMode === 'interactive') {
      handleStartInteractiveStory(bundle.interactive.id);
    } else if (targetMode === 'quiz') {
      setQuizFocusTaleTitle(bundle.tale.title);
      setActiveMode('quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      id="top"
      className="min-h-screen overflow-x-clip flex flex-col bg-[#FAF8F3] dark:bg-[#111318] text-[#1C1917] dark:text-[#F3F0E6] transition-colors"
    >
      <TopBar activeMode={activeMode} onSelectMode={handleSelectMode} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {activeMode === 'home' && (
          <div className="space-y-6">
            {unlockError && (
              <div
                role="alert"
                className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-800 dark:text-red-200 flex items-center justify-between gap-4"
              >
                <span>{unlockError}</span>
                <button
                  type="button"
                  onClick={() => setUnlockError(null)}
                  className="underline font-medium shrink-0"
                >
                  ปิดแจ้งเตือน
                </button>
              </div>
            )}
            <HomeGateway
              tales={allTales}
              onSelectMode={handleSelectMode}
              onOpen547Catalog={handleOpen547Catalog}
              onOpenTale={handleOpenTale}
              onStartInteractiveStory={handleStartInteractiveStory}
              onUnlockAndOpen={handleUnlockAndOpen}
              loadingNumber={loadingNumber}
              bestQuizScore={bestQuizScore}
              totalTalesCount={allTales.length}
              totalStoriesCount={allInteractiveStories.length}
              totalQuizCount={allQuizQuestions.length}
            />
          </div>
        )}

        {activeMode === 'library' && (
          <LibraryView
            tales={allTales}
            selectedTaleId={selectedTaleId}
            onSelectTale={handleSelectTaleInLibrary}
            onStartInteractiveStory={handleStartInteractiveStory}
            activeSubTab={librarySubTab}
            onChangeSubTab={setLibrarySubTab}
            unlockedNumbers={unlockedNumbers}
            readNumbers={readNumbers}
            onToggleReadNumber={toggleReadNumber}
            loadingNumber={loadingNumber}
            errorMessage={unlockError}
            onUnlockAndOpen={handleUnlockAndOpen}
            onUpdateTaleSceneVisual={handleUpdateTaleSceneVisual}
          />
        )}

        {activeMode === 'interactive' && (
          <InteractiveStoryView
            stories={allInteractiveStories}
            tales={allTales}
            activeStoryId={activeInteractiveId}
            onSelectStory={setActiveInteractiveId}
            onOpenTaleInLibrary={handleOpenTale}
            onOpen547Catalog={handleOpen547Catalog}
            onGoToQuiz={() => handleSelectMode('quiz')}
            onStoryCompleted={markInteractiveCompleted}
          />
        )}

        {activeMode === 'quiz' && (
          <QuizGameView
            questions={allQuizQuestions}
            focusTaleTitle={quizFocusTaleTitle}
            onClearFocusTale={() => setQuizFocusTaleTitle(null)}
            bestScore={bestQuizScore}
            onUpdateBestScore={recordQuizScore}
            onOpenLibrary={() => handleSelectMode('library')}
            onOpen547Catalog={handleOpen547Catalog}
          />
        )}
      </main>

      <footer className="border-t border-[#E4DEC9] dark:border-[#2A2D38] bg-[#F3EFE6]/60 dark:bg-[#171920]/70 mt-12 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-600 dark:text-stone-400">
          <div>
            <span className="font-serif font-semibold text-[#1C1917] dark:text-[#F3F0E6]">
              ศาลาชาดก
            </span>
            <span aria-hidden="true"> · </span>
            <span>คลังนิทานชาดก ๕๔๗ เรื่อง นิทานโต้ตอบ และเกมทายข้อคิดธรรม</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleSelectMode('library')}
              className="hover:text-[#1E3A8A] dark:hover:text-amber-300 transition-colors"
            >
              คลังชาดก
            </button>
            <button
              type="button"
              onClick={handleOpen547Catalog}
              className="hover:text-[#1E3A8A] dark:hover:text-amber-300 transition-colors"
            >
              สารบัญ ๕๔๗ เรื่อง
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('interactive')}
              className="hover:text-[#1E3A8A] dark:hover:text-amber-300 transition-colors"
            >
              เล่านิทานโต้ตอบ
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('quiz')}
              className="hover:text-[#1E3A8A] dark:hover:text-amber-300 transition-colors"
            >
              ทายข้อคิด
            </button>
          </div>
        </div>
      </footer>

      <OfflineIndicator />
    </div>
  );
}
