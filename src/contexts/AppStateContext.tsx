import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  BookmarkRecord,
  DynamicBundle,
  FontSizePreference,
  ReflectionNoteRecord,
  ThemePreference,
} from '../types/jataka';

const STORAGE_KEYS = {
  bestScore: 'sala_jataka_best_quiz_score',
  readNumbers: 'sala_jataka_read_numbers_v1',
  completedInteractive: 'sala_jataka_completed_interactive_v1',
  quizAttempts: 'sala_jataka_quiz_attempts_v1',
  unlockedNumbers: 'sala_jataka_unlocked_numbers_v1',
  theme: 'sala_jataka_theme_v1',
  fontSize: 'sala_jataka_font_size_v1',
  bookmarks: 'sala_jataka_bookmarks_v1',
  notes: 'sala_jataka_notes_v1',
};

function sanitizeValidId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned.length > 0 ? cleaned : 'tale';
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

interface AppStateContextValue {
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isCloudSynced: boolean;

  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;

  fontSize: FontSizePreference;
  setFontSize: (size: FontSizePreference) => void;

  readNumbers: number[];
  markNumberAsRead: (num: number) => void;
  toggleReadNumber: (num: number) => void;

  syncedUnlockedNumbers: number[];
  recordUnlockedNumber: (num: number) => void;

  completedInteractiveIds: string[];
  markInteractiveCompleted: (storyId: string) => void;

  bestQuizScore: number | null;
  quizAttemptsCount: number;
  recordQuizScore: (accuracyPercent: number) => void;

  bookmarks: Record<string, BookmarkRecord>;
  isBookmarked: (taleId: string) => boolean;
  toggleBookmark: (payload: {
    taleId: string;
    jatakaNumber: number;
    title: string;
    barami: string;
  }) => Promise<void>;

  favorites: Record<string, BookmarkRecord>;
  isFavorite: (taleId: string) => boolean;
  toggleFavorite: (payload: {
    taleId: string;
    jatakaNumber: number;
    title: string;
    barami: string;
  }) => Promise<void>;

  notes: Record<string, ReflectionNoteRecord>;
  saveReflectionNote: (payload: {
    taleId: string;
    jatakaNumber: number;
    title: string;
    content: string;
  }) => Promise<void>;
  deleteReflectionNote: (taleId: string) => Promise<void>;

  sharedBundles: Record<number, DynamicBundle>;
  fetchSharedBundleByNumber: (jatakaNumber: number) => Promise<DynamicBundle | null>;
  publishSharedBundle: (bundle: DynamicBundle) => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userDocReady, setUserDocReady] = useState(false);

  const [theme, setThemeState] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [fontSize, setFontSizeState] = useState<FontSizePreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.fontSize);
      return saved === 'sm' || saved === 'lg' ? saved : 'md';
    } catch {
      return 'md';
    }
  });

  const [readNumbers, setReadNumbers] = useState<number[]>(() =>
    readLocalJson<number[]>(STORAGE_KEYS.readNumbers, []).filter(
      (n) => Number.isInteger(n) && n >= 1 && n <= 547
    )
  );

  const [syncedUnlockedNumbers, setSyncedUnlockedNumbers] = useState<number[]>(() =>
    readLocalJson<number[]>(STORAGE_KEYS.unlockedNumbers, []).filter(
      (n) => Number.isInteger(n) && n >= 1 && n <= 547
    )
  );

  const [completedInteractiveIds, setCompletedInteractiveIds] = useState<string[]>(
    () => readLocalJson<string[]>(STORAGE_KEYS.completedInteractive, [])
  );

  const [bestQuizScore, setBestQuizScore] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.bestScore);
      if (!saved) return null;
      const n = Number(saved);
      return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : null;
    } catch {
      return null;
    }
  });

  const [quizAttemptsCount, setQuizAttemptsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.quizAttempts);
      const n = saved ? Number(saved) : 0;
      return Number.isInteger(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  });

  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkRecord>>(() =>
    readLocalJson<Record<string, BookmarkRecord>>(STORAGE_KEYS.bookmarks, {})
  );

  const [notes, setNotes] = useState<Record<string, ReflectionNoteRecord>>(() =>
    readLocalJson<Record<string, ReflectionNoteRecord>>(STORAGE_KEYS.notes, {})
  );

  const [sharedBundles, setSharedBundles] = useState<Record<number, DynamicBundle>>({});

  // Sync HTML .dark class with theme preference
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.fontSize, fontSize);
    } catch {
      // ignore
    }
  }, [fontSize]);

  // Keep latest local state in refs for initial login merge
  const stateSnapshotRef = useRef({
    readNumbers,
    syncedUnlockedNumbers,
    completedInteractiveIds,
    bestQuizScore,
    quizAttemptsCount,
    theme,
    fontSize,
    bookmarks,
    notes,
  });
  stateSnapshotRef.current = {
    readNumbers,
    syncedUnlockedNumbers,
    completedInteractiveIds,
    bestQuizScore,
    quizAttemptsCount,
    theme,
    fontSize,
    bookmarks,
    notes,
  };

  // Monitor Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setUserDocReady(false);
        return;
      }

      const uid = nextUser.uid;
      const userPath = `users/${uid}`;
      const privatePath = `users/${uid}/private/profile`;

      try {
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        const local = stateSnapshotRef.current;

        const safeDisplayName = (
          nextUser.displayName ||
          nextUser.email?.split('@')[0] ||
          'กัลยาณมิตร'
        ).slice(0, 100);

        if (!snap.exists()) {
          await setDoc(userRef, {
            uid,
            displayName: safeDisplayName,
            readNumbers: local.readNumbers.slice(0, 547),
            unlockedNumbers: local.syncedUnlockedNumbers.slice(0, 547),
            completedInteractiveIds: local.completedInteractiveIds
              .map(sanitizeValidId)
              .slice(0, 547),
            quizAttemptsCount: Math.max(0, Math.min(100000, local.quizAttemptsCount)),
            bestQuizScore:
              local.bestQuizScore !== null ? Math.round(local.bestQuizScore) : -1,
            theme: local.theme,
            fontSize: local.fontSize,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Merge local unsaved progress into cloud profile
          const cloudData = snap.data() as {
            readNumbers?: number[];
            unlockedNumbers?: number[];
            completedInteractiveIds?: string[];
            quizAttemptsCount?: number;
            bestQuizScore?: number;
          };
          const mergedRead = Array.from(
            new Set([...(cloudData.readNumbers || []), ...local.readNumbers])
          )
            .sort((a, b) => a - b)
            .slice(0, 547);
          const mergedUnlocked = Array.from(
            new Set([
              ...(cloudData.unlockedNumbers || []),
              ...local.syncedUnlockedNumbers,
            ])
          )
            .sort((a, b) => a - b)
            .slice(0, 547);
          const mergedInteractive = Array.from(
            new Set([
              ...(cloudData.completedInteractiveIds || []),
              ...local.completedInteractiveIds,
            ])
          ).slice(0, 547);
          const cloudBest =
            typeof cloudData.bestQuizScore === 'number'
              ? cloudData.bestQuizScore
              : -1;
          const localBest =
            local.bestQuizScore !== null ? Math.round(local.bestQuizScore) : -1;
          const mergedBest = Math.max(cloudBest, localBest);
          const mergedAttempts = Math.max(
            cloudData.quizAttemptsCount || 0,
            local.quizAttemptsCount
          );

          await updateDoc(userRef, {
            displayName: safeDisplayName,
            readNumbers: mergedRead,
            unlockedNumbers: mergedUnlocked,
            completedInteractiveIds: mergedInteractive,
            quizAttemptsCount: mergedAttempts,
            bestQuizScore: mergedBest,
            updatedAt: serverTimestamp(),
          });
        }

        // Sync isolated PII private profile
        const privateRef = doc(db, 'users', uid, 'private', 'profile');
        const privateSnap = await getDoc(privateRef);
        const safeEmail = (nextUser.email || '').slice(0, 254);
        const safePhoto = (nextUser.photoURL || '').slice(0, 500);
        if (!privateSnap.exists()) {
          await setDoc(privateRef, {
            uid,
            email: safeEmail,
            photoURL: safePhoto,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(privateRef, {
            email: safeEmail,
            photoURL: safePhoto,
            updatedAt: serverTimestamp(),
          });
        }

        setUserDocReady(true);
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.WRITE, `${userPath} / ${privatePath}`);
        } catch {
          setAuthError('ไม่สามารถซิงก์ข้อมูลผู้ใช้กับคลาวด์ได้ชั่วคราว ระบบจะใช้ข้อมูลบนอุปกรณ์');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore listeners (active only when authenticated and user doc initialized)
  useEffect(() => {
    if (!authReady || !user || !userDocReady) return;
    const uid = user.uid;

    const userRef = doc(db, 'users', uid);
    const unsubUser = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as {
          readNumbers?: number[];
          unlockedNumbers?: number[];
          completedInteractiveIds?: string[];
          quizAttemptsCount?: number;
          bestQuizScore?: number;
          theme?: ThemePreference;
          fontSize?: FontSizePreference;
        };
        if (Array.isArray(data.readNumbers)) {
          setReadNumbers(data.readNumbers);
          writeLocalJson(STORAGE_KEYS.readNumbers, data.readNumbers);
        }
        if (Array.isArray(data.unlockedNumbers)) {
          setSyncedUnlockedNumbers(data.unlockedNumbers);
          writeLocalJson(STORAGE_KEYS.unlockedNumbers, data.unlockedNumbers);
        }
        if (Array.isArray(data.completedInteractiveIds)) {
          setCompletedInteractiveIds(data.completedInteractiveIds);
          writeLocalJson(
            STORAGE_KEYS.completedInteractive,
            data.completedInteractiveIds
          );
        }
        if (typeof data.quizAttemptsCount === 'number') {
          setQuizAttemptsCount(data.quizAttemptsCount);
          try {
            localStorage.setItem(
              STORAGE_KEYS.quizAttempts,
              String(data.quizAttemptsCount)
            );
          } catch {
            // ignore
          }
        }
        if (typeof data.bestQuizScore === 'number') {
          const normalized = data.bestQuizScore >= 0 ? data.bestQuizScore : null;
          setBestQuizScore(normalized);
          if (normalized !== null) {
            try {
              localStorage.setItem(STORAGE_KEYS.bestScore, String(normalized));
            } catch {
              // ignore
            }
          }
        }
        if (data.theme === 'light' || data.theme === 'dark') {
          setThemeState(data.theme);
        }
        if (
          data.fontSize === 'sm' ||
          data.fontSize === 'md' ||
          data.fontSize === 'lg'
        ) {
          setFontSizeState(data.fontSize);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }
    );

    const bookmarksCol = collection(db, 'users', uid, 'bookmarks');
    const unsubBookmarks = onSnapshot(
      bookmarksCol,
      (snap) => {
        const next: Record<string, BookmarkRecord> = {};
        snap.forEach((docSnap) => {
          const d = docSnap.data() as {
            taleId: string;
            jatakaNumber: number;
            title: string;
            barami: string;
            createdAt?: { toMillis?: () => number };
          };
          next[d.taleId] = {
            taleId: d.taleId,
            jatakaNumber: d.jatakaNumber,
            title: d.title,
            barami: d.barami,
            createdAtMs: d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now(),
          };
        });
        setBookmarks(next);
        writeLocalJson(STORAGE_KEYS.bookmarks, next);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${uid}/bookmarks`);
      }
    );

    const notesCol = collection(db, 'users', uid, 'notes');
    const unsubNotes = onSnapshot(
      notesCol,
      (snap) => {
        const next: Record<string, ReflectionNoteRecord> = {};
        snap.forEach((docSnap) => {
          const d = docSnap.data() as {
            taleId: string;
            jatakaNumber: number;
            title: string;
            content: string;
            updatedAt?: { toMillis?: () => number };
          };
          next[d.taleId] = {
            taleId: d.taleId,
            jatakaNumber: d.jatakaNumber,
            title: d.title,
            content: d.content,
            updatedAtMs: d.updatedAt?.toMillis ? d.updatedAt.toMillis() : Date.now(),
          };
        });
        setNotes(next);
        writeLocalJson(STORAGE_KEYS.notes, next);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${uid}/notes`);
      }
    );

    return () => {
      unsubUser();
      unsubBookmarks();
      unsubNotes();
    };
  }, [authReady, user, userDocReady]);

  // Global real-time listener for community-shared generated Jataka bundles (readable by all users)
  useEffect(() => {
    const sharedQuery = query(
      collection(db, 'shared_bundles'),
      where('isPublished', '==', true)
    );
    const unsubShared = onSnapshot(
      sharedQuery,
      (snap) => {
        const next: Record<number, DynamicBundle> = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data() as {
            jatakaNumber?: number;
            bundle?: DynamicBundle;
          };
          const num = Number(data?.jatakaNumber);
          if (
            Number.isInteger(num) &&
            num >= 1 &&
            num <= 547 &&
            data.bundle?.tale &&
            data.bundle?.interactive
          ) {
            next[num] = data.bundle;
          }
        });
        setSharedBundles(next);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'shared_bundles');
      }
    );

    return () => unsubShared();
  }, []);

  const syncProgressFields = useCallback(
    async (fields: Record<string, unknown>) => {
      if (!user || !userDocReady) return;
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          ...fields,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, userDocReady]
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes('popup-closed-by-user')
          ? 'ท่านปิดหน้าต่างเข้าสู่ระบบก่อนดำเนินการเสร็จสิ้น'
          : 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง';
      setAuthError(msg);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthBusy(true);
    try {
      await firebaseSignOut(auth);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      setThemeState(next);
      void syncProgressFields({ theme: next });
    },
    [syncProgressFields]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const setFontSize = useCallback(
    (next: FontSizePreference) => {
      setFontSizeState(next);
      void syncProgressFields({ fontSize: next });
    },
    [syncProgressFields]
  );

  const markNumberAsRead = useCallback(
    (num: number) => {
      if (!Number.isInteger(num) || num < 1 || num > 547) return;
      setReadNumbers((prev) => {
        if (prev.includes(num)) return prev;
        const next = [...prev, num].sort((a, b) => a - b).slice(0, 547);
        writeLocalJson(STORAGE_KEYS.readNumbers, next);
        void syncProgressFields({ readNumbers: next });
        return next;
      });
    },
    [syncProgressFields]
  );

  const toggleReadNumber = useCallback(
    (num: number) => {
      if (!Number.isInteger(num) || num < 1 || num > 547) return;
      setReadNumbers((prev) => {
        const exists = prev.includes(num);
        const next = (
          exists ? prev.filter((item) => item !== num) : [...prev, num]
        )
          .sort((a, b) => a - b)
          .slice(0, 547);
        writeLocalJson(STORAGE_KEYS.readNumbers, next);
        void syncProgressFields({ readNumbers: next });
        return next;
      });
    },
    [syncProgressFields]
  );

  const recordUnlockedNumber = useCallback(
    (num: number) => {
      if (!Number.isInteger(num) || num < 1 || num > 547) return;
      setSyncedUnlockedNumbers((prev) => {
        if (prev.includes(num)) return prev;
        const next = [...prev, num].sort((a, b) => a - b).slice(0, 547);
        writeLocalJson(STORAGE_KEYS.unlockedNumbers, next);
        void syncProgressFields({ unlockedNumbers: next });
        return next;
      });
    },
    [syncProgressFields]
  );

  const markInteractiveCompleted = useCallback(
    (storyId: string) => {
      const safeId = sanitizeValidId(storyId);
      setCompletedInteractiveIds((prev) => {
        if (prev.includes(safeId)) return prev;
        const next = [...prev, safeId].slice(0, 547);
        writeLocalJson(STORAGE_KEYS.completedInteractive, next);
        void syncProgressFields({ completedInteractiveIds: next });
        return next;
      });
    },
    [syncProgressFields]
  );

  const recordQuizScore = useCallback(
    (accuracyPercent: number) => {
      const cleanScore = Math.max(0, Math.min(100, Math.round(accuracyPercent)));
      const nextBest =
        bestQuizScore === null
          ? cleanScore
          : Math.max(bestQuizScore, cleanScore);
      const nextAttempts = Math.min(100000, quizAttemptsCount + 1);

      setBestQuizScore(nextBest);
      setQuizAttemptsCount(nextAttempts);
      try {
        localStorage.setItem(STORAGE_KEYS.bestScore, String(nextBest));
        localStorage.setItem(STORAGE_KEYS.quizAttempts, String(nextAttempts));
      } catch {
        // ignore
      }
      void syncProgressFields({
        bestQuizScore: nextBest,
        quizAttemptsCount: nextAttempts,
      });
    },
    [bestQuizScore, quizAttemptsCount, syncProgressFields]
  );

  const isBookmarked = useCallback(
    (taleId: string) => Boolean(bookmarks[sanitizeValidId(taleId)]),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (payload: {
      taleId: string;
      jatakaNumber: number;
      title: string;
      barami: string;
    }) => {
      const safeId = sanitizeValidId(payload.taleId);
      const exists = Boolean(bookmarks[safeId]);

      const cleanNum = Math.floor(Math.max(0, Math.min(547, Number(payload.jatakaNumber) || 0)));

      if (!user || !userDocReady) {
        setBookmarks((prev) => {
          const next = { ...prev };
          if (exists) {
            delete next[safeId];
          } else {
            next[safeId] = {
              taleId: safeId,
              jatakaNumber: cleanNum,
              title: payload.title.slice(0, 200) || 'นิทานชาดก',
              barami: payload.barami.slice(0, 120) || 'คุณธรรม',
              createdAtMs: Date.now(),
            };
          }
          writeLocalJson(STORAGE_KEYS.bookmarks, next);
          return next;
        });
        return;
      }

      const path = `users/${user.uid}/bookmarks/${safeId}`;
      const docRef = doc(db, 'users', user.uid, 'bookmarks', safeId);
      try {
        if (exists) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, {
            uid: user.uid,
            taleId: safeId,
            jatakaNumber: cleanNum,
            title: payload.title.slice(0, 200) || 'นิทานชาดก',
            barami: payload.barami.slice(0, 120) || 'คุณธรรม',
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(
          err,
          exists ? OperationType.DELETE : OperationType.CREATE,
          path
        );
      }
    },
    [bookmarks, user, userDocReady]
  );

  const saveReflectionNote = useCallback(
    async (payload: {
      taleId: string;
      jatakaNumber: number;
      title: string;
      content: string;
    }) => {
      const safeId = sanitizeValidId(payload.taleId);
      const trimmed = payload.content.trim().slice(0, 2000);
      if (!trimmed) return;

      if (!user || !userDocReady) {
        setNotes((prev) => {
          const next = {
            ...prev,
            [safeId]: {
              taleId: safeId,
              jatakaNumber: Math.max(0, Math.min(547, payload.jatakaNumber || 0)),
              title: payload.title.slice(0, 200),
              content: trimmed,
              updatedAtMs: Date.now(),
            },
          };
          writeLocalJson(STORAGE_KEYS.notes, next);
          return next;
        });
        return;
      }

      const path = `users/${user.uid}/notes/${safeId}`;
      const docRef = doc(db, 'users', user.uid, 'notes', safeId);
      const existingNote = Boolean(notes[safeId]);
      try {
        if (existingNote) {
          await updateDoc(docRef, {
            title: payload.title.slice(0, 200) || 'นิทานชาดก',
            jatakaNumber: Math.max(0, Math.min(547, payload.jatakaNumber || 0)),
            content: trimmed,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(docRef, {
            uid: user.uid,
            taleId: safeId,
            jatakaNumber: Math.max(0, Math.min(547, payload.jatakaNumber || 0)),
            title: payload.title.slice(0, 200) || 'นิทานชาดก',
            content: trimmed,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(
          err,
          existingNote ? OperationType.UPDATE : OperationType.CREATE,
          path
        );
      }
    },
    [notes, user, userDocReady]
  );

  const deleteReflectionNote = useCallback(
    async (taleId: string) => {
      const safeId = sanitizeValidId(taleId);
      if (!user || !userDocReady) {
        setNotes((prev) => {
          const next = { ...prev };
          delete next[safeId];
          writeLocalJson(STORAGE_KEYS.notes, next);
          return next;
        });
        return;
      }

      const path = `users/${user.uid}/notes/${safeId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'notes', safeId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, userDocReady]
  );

  const fetchSharedBundleByNumber = useCallback(
    async (jatakaNumber: number): Promise<DynamicBundle | null> => {
      if (!Number.isInteger(jatakaNumber) || jatakaNumber < 1 || jatakaNumber > 547) {
        return null;
      }
      if (sharedBundles[jatakaNumber]) {
        return sharedBundles[jatakaNumber];
      }
      const bundleId = `canon-${jatakaNumber}`;
      const path = `shared_bundles/${bundleId}`;
      try {
        const snap = await getDoc(doc(db, 'shared_bundles', bundleId));
        if (!snap.exists()) return null;
        const data = snap.data() as { bundle?: DynamicBundle };
        if (data?.bundle?.tale && data.bundle?.interactive) {
          setSharedBundles((prev) => ({ ...prev, [jatakaNumber]: data.bundle! }));
          return data.bundle;
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    },
    [sharedBundles]
  );

  const publishSharedBundle = useCallback(
    async (bundle: DynamicBundle) => {
      if (!user || !user.emailVerified) return;
      const num = Number(bundle?.jatakaNumber);
      if (!Number.isInteger(num) || num < 1 || num > 547) return;
      if (
        !bundle?.tale?.id ||
        !bundle?.tale?.title ||
        !Array.isArray(bundle?.tale?.paragraphs) ||
        bundle.tale.paragraphs.length === 0 ||
        !Array.isArray(bundle?.interactive?.scenes) ||
        bundle.interactive.scenes.length === 0 ||
        !Array.isArray(bundle?.quiz) ||
        bundle.quiz.length === 0
      ) {
        return;
      }

      const bundleId = `canon-${num}`;
      const path = `shared_bundles/${bundleId}`;
      const sanitizedPayload: DynamicBundle = {
        jatakaNumber: num,
        tale: {
          ...bundle.tale,
          id: String(bundle.tale.id).slice(0, 64),
          title: String(bundle.tale.title).slice(0, 200),
          paragraphs: bundle.tale.paragraphs.slice(0, 20),
        },
        interactive: {
          ...bundle.interactive,
          scenes: bundle.interactive.scenes.slice(0, 10),
        },
        quiz: bundle.quiz.slice(0, 10),
      };

      try {
        const docRef = doc(db, 'shared_bundles', bundleId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          await setDoc(docRef, {
            bundleId,
            jatakaNumber: num,
            title: (sanitizedPayload.tale.title || `ชาดกลำดับที่ ${num}`).slice(0, 200),
            barami: (sanitizedPayload.tale.barami || 'คุณธรรม').slice(0, 150),
            contributorUid: user.uid,
            isPublished: true,
            bundle: sanitizedPayload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingData = snap.data() as { contributorUid?: string };
          if (existingData?.contributorUid === user.uid) {
            await updateDoc(docRef, {
              bundle: sanitizedPayload,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user]
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      user,
      authReady,
      authBusy,
      authError,
      clearAuthError: () => setAuthError(null),
      signInWithGoogle,
      signOut,
      isCloudSynced: Boolean(user && userDocReady),
      theme,
      setTheme,
      toggleTheme,
      fontSize,
      setFontSize,
      readNumbers,
      markNumberAsRead,
      toggleReadNumber,
      syncedUnlockedNumbers,
      recordUnlockedNumber,
      completedInteractiveIds,
      markInteractiveCompleted,
      bestQuizScore,
      quizAttemptsCount,
      recordQuizScore,
      bookmarks,
      isBookmarked,
      toggleBookmark,
      favorites: bookmarks,
      isFavorite: isBookmarked,
      toggleFavorite: toggleBookmark,
      notes,
      saveReflectionNote,
      deleteReflectionNote,
      sharedBundles,
      fetchSharedBundleByNumber,
      publishSharedBundle,
    }),
    [
      user,
      authReady,
      authBusy,
      authError,
      signInWithGoogle,
      signOut,
      userDocReady,
      theme,
      setTheme,
      toggleTheme,
      fontSize,
      setFontSize,
      readNumbers,
      markNumberAsRead,
      toggleReadNumber,
      syncedUnlockedNumbers,
      recordUnlockedNumber,
      completedInteractiveIds,
      markInteractiveCompleted,
      bestQuizScore,
      quizAttemptsCount,
      recordQuizScore,
      bookmarks,
      isBookmarked,
      toggleBookmark,
      notes,
      saveReflectionNote,
      deleteReflectionNote,
      sharedBundles,
      fetchSharedBundleByNumber,
      publishSharedBundle,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
};

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
