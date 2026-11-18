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
  DynamicBundle,
  InteractiveStory,
  JatakaTale,
  QuizQuestion,
  SceneVisualSpec,
} from './types/jataka';

const BUNDLES_STORAGE_KEY = 'sala_jataka_dynamic_bundles_v1';

export default function App() {
  const {
    user,
    readNumbers,
    markNumberAsRead,
    toggleReadNumber,
    syncedUnlockedNumbers,
    recordUnlockedNumber,
    markInteractiveCompleted,
    bestQuizScore,
    recordQuizScore,
    sharedBundles,
    fetchSharedBundleByNumber,
    publishSharedBundle,
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

    fetch('/api/jataka/bundles')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { bundles?: DynamicBundle[] } | null) => {
        if (!Array.isArray(data?.bundles) || data.bundles.length === 0) return;
        setDynamicBundles((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const b of data.bundles!) {
            const num = Number(b?.jatakaNumber);
            if (Number.isInteger(num) && num >= 1 && num <= 547 && !next[num]) {
              next[num] = b;
              changed = true;
            }
          }
          if (!changed) return prev;
          try {
            localStorage.setItem(BUNDLES_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore storage quota
          }
          return next;
        });
      })
      .catch(() => {
        // Ignore shared bundles fetch error
      });
  }, []);

  // Merge community Firestore bundles with server/client cached bundles
  const mergedBundles = useMemo<Record<number, DynamicBundle>>(
    () => ({
      ...sharedBundles,
      ...dynamicBundles,
    }),
    [sharedBundles, dynamicBundles]
  );

  // Backfill server/client cached bundles to Firestore when signed in so all users share them permanently
  useEffect(() => {
    if (!user || !user.emailVerified) return;
    const missingFromCloud = Object.values(dynamicBundles).filter(
      (b) =>
        Number.isInteger(b?.jatakaNumber) &&
        b.jatakaNumber >= 1 &&
        b.jatakaNumber <= 547 &&
        !sharedBundles[b.jatakaNumber]
    );
    if (missingFromCloud.length === 0) return;
    for (const bundle of missingFromCloud) {
      void publishSharedBundle(bundle);
    }
  }, [user, dynamicBundles, sharedBundles, publishSharedBundle]);

  const allTales = useMemo<JatakaTale[]>(() => {
    const extras: JatakaTale[] = Object.values(mergedBundles)
      .sort((a, b) => a.jatakaNumber - b.jatakaNumber)
      .map((b) => ({
        ...b.tale,
        collectionGroup: 'nipata',
        image: HERO_ARTWORK,
        interactiveStoryId: b.interactive.id,
      }));
    return [...JATAKA_TALES, ...extras];
  }, [mergedBundles]);

  const allInteractiveStories = useMemo<InteractiveStory[]>(() => {
    const extras: InteractiveStory[] = Object.values(mergedBundles)
      .sort((a, b) => a.jatakaNumber - b.jatakaNumber)
      .map((b) => ({
        ...b.interactive,
        image: HERO_ARTWORK,
      }));
    return [...INTERACTIVE_STORIES, ...extras];
  }, [mergedBundles]);

  const allQuizQuestions = useMemo<QuizQuestion[]>(() => {
    const extras: QuizQuestion[] = Object.values(mergedBundles)
      .sort((a, b) => a.jatakaNumber - b.jatakaNumber)
      .flatMap((b) => b.quiz);
    return [...QUIZ_QUESTIONS, ...extras];
  }, [mergedBundles]);

  const unlockedNumbers = useMemo(() => {
    const mergedNums = Object.keys(mergedBundles).map(Number);
    return Array.from(
      new Set([...serverCachedNumbers, ...mergedNums, ...syncedUnlockedNumbers])
    );
  }, [mergedBundles, serverCachedNumbers, syncedUnlockedNumbers]);

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
    const baseBundle = mergedBundles[jatakaNumber];
    if (!baseBundle) return;
    const updatedBundle: DynamicBundle = {
      ...baseBundle,
      tale: {
        ...baseBundle.tale,
        sceneVisual,
      },
    };
    setDynamicBundles((prev) => {
      const next: Record<number, DynamicBundle> = {
        ...prev,
        [jatakaNumber]: updatedBundle,
      };
      try {
        localStorage.setItem(BUNDLES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota
      }
      return next;
    });
    void publishSharedBundle(updatedBundle);
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

    // 2. Check already unlocked client / community cache
    let bundle: DynamicBundle | undefined = mergedBundles[jatakaNumber];
    if (!bundle) {
      setLoadingNumber(jatakaNumber);
      try {
        // 2a. Check Firestore shared community library first
        try {
          const cloudBundle = await fetchSharedBundleByNumber(jatakaNumber);
          if (cloudBundle) {
            bundle = cloudBundle;
          }
        } catch {
          // Continue to server cache / generation fallback if Firestore lookup fails
        }

        // 2b. Check server/Worker KV cache via GET (zero Gemini call)
        if (!bundle) {
          try {
            const getRes = await fetch(`/api/jataka/bundle/${jatakaNumber}`);
            if (getRes.ok) {
              const cachedData = (await getRes.json()) as { bundle?: DynamicBundle };
              if (cachedData?.bundle) {
                bundle = cachedData.bundle;
              }
            }
          } catch {
            // Continue to POST generation fallback
          }
        }

        // 2c. Generate once via server-side Gemini API & cache for all users
        if (!bundle) {
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
        }

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

    if (!sharedBundles[jatakaNumber]) {
      void publishSharedBundle(bundle);
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
              readNumbers={readNumbers}
              unlockedNumbers={unlockedNumbers}
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
