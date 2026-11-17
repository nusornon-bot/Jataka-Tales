/**
 * Firestore Security Rules Test Suite ("Dirty Dozen" Payloads Verification)
 * Compatible with @firebase/rules-unit-testing when running against Firestore Emulator.
 */
export interface DirtyDozenCase {
  id: string;
  description: string;
  actorUid: string | null;
  emailVerified: boolean;
  operation: 'get' | 'list' | 'create' | 'update';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 'DD-01',
    description: 'Unauthenticated read on user progress',
    actorUid: null,
    emailVerified: false,
    operation: 'get',
    path: 'users/alice',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    description: 'Unverified email spoof creating user progress',
    actorUid: 'bob',
    emailVerified: false,
    operation: 'create',
    path: 'users/bob',
    payload: { uid: 'bob', displayName: 'Bob', readNumbers: [], unlockedNumbers: [], completedInteractiveIds: [], quizAttemptsCount: 0, bestQuizScore: -1, theme: 'light', fontSize: 'md' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    description: 'Cross-user PII read on private profile',
    actorUid: 'bob',
    emailVerified: true,
    operation: 'get',
    path: 'users/alice/private/profile',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    description: 'Cross-user write on reflection note',
    actorUid: 'bob',
    emailVerified: true,
    operation: 'create',
    path: 'users/alice/notes/temiya',
    payload: { uid: 'bob', taleId: 'temiya', jatakaNumber: 538, title: 'เตมียชาดก', content: 'บันทึกปลอม' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    description: 'Ghost field injection (isAdmin: true) on create',
    actorUid: 'alice',
    emailVerified: true,
    operation: 'create',
    path: 'users/alice',
    payload: { uid: 'alice', displayName: 'Alice', isAdmin: true, readNumbers: [], unlockedNumbers: [], completedInteractiveIds: [], quizAttemptsCount: 0, bestQuizScore: -1, theme: 'light', fontSize: 'md' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    description: 'UID mismatch inside bookmark payload',
    actorUid: 'alice',
    emailVerified: true,
    operation: 'create',
    path: 'users/alice/bookmarks/temiya',
    payload: { uid: 'bob', taleId: 'temiya', jatakaNumber: 538, title: 'เตมียชาดก', barami: 'เนกขัมมบารมี' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    description: 'Invalid document ID poisoning with spaces/symbols',
    actorUid: 'alice',
    emailVerified: true,
    operation: 'create',
    path: 'users/alice/notes/bad id!!',
    payload: { uid: 'alice', taleId: 'bad id!!', jatakaNumber: 538, title: 'เตมียชาดก', content: 'test' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    description: 'Oversized readNumbers array exceeding 547 cap',
    actorUid: 'alice',
    emailVerified: true,
    operation: 'update',
    path: 'users/alice',
    payload: { readNumbers: Array.from({ length: 548 }, (_, i) => i + 1) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    description: 'Oversized reflection note content (>2000 chars)',
    actorUid: 'alice',
    emailVerified: true,
    operation: 'create',
    path: 'users/alice/notes/temiya',
    payload: { uid: 'alice', taleId: 'temiya', jatakaNumber: 538, title: 'เตมียชาดก', content: 'ก'.repeat(2005) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    description: 'Client-forged past timestamp instead of request.time',
    actorUid: 'alice',
    emailVerified: true,
    operation: 'create',
    path: 'users/alice/bookmarks/temiya',
    payload: { uid: 'alice', taleId: 'temiya', jatakaNumber: 538, title: 'เตมียชาดก', barami: 'เนกขัมมบารมี', createdAt: new Date(0) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    description: 'Immutable taleId mutation on note update',
    actorUid: 'alice',
    emailVerified: true,
    operation: 'update',
    path: 'users/alice/notes/temiya',
    payload: { taleId: 'mahajanaka', content: 'updated' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    description: 'Type poisoning on theme preference update',
    actorUid: 'alice',
    emailVerified: true,
    operation: 'update',
    path: 'users/alice',
    payload: { theme: 'neon' },
    expected: 'PERMISSION_DENIED',
  },
];
