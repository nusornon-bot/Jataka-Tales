# Security Specification — ศาลาชาดก (Sala Jataka)

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document under `/users/{userId}`, `/users/{userId}/private/{profileId}`, `/users/{userId}/bookmarks/{taleId}`, and `/users/{userId}/notes/{taleId}` belongs exclusively to `request.auth.uid == userId` with `request.auth.token.email_verified == true`.
2. **PII Split Collection**: `email` and `photoURL` are isolated in `/users/{userId}/private/profile` and are never written to `/users/{userId}`.
3. **Strict Key Allowlists & No Ghost Fields**: Every `create` verifies exact `keys().hasAll(...) && keys().hasOnly(...)` and every `update` uses action-scoped `affectedKeys().hasOnly(...)` wrapped by `isValid[Entity](incoming())`.
4. **Immutable Ownership & Creation Timestamps**: `uid`, `taleId`, and `createdAt` cannot be modified after creation. `createdAt` and `updatedAt` must equal `request.time`.
5. **Bounded Arrays & Strings**: `readNumbers` and `unlockedNumbers` are bounded to `<= 547` elements; `completedInteractiveIds` is bounded to `<= 547` elements; `content` of reflection notes is bounded to `1..2000` characters; all document IDs enforce `^[a-zA-Z0-9_\-]+$` with max length 128.
6. **Zero Unauthenticated or Client-Delegated List Access**: `/users` and `/users/{userId}/private` forbid `list`; `/bookmarks` and `/notes` require `isOwner(userId) && resource.data.uid == request.auth.uid` on `list`; `/shared_bundles` enforces `resource.data.isPublished == true` on `list` and contains zero PII.
7. **Community Shared Bundles Integrity**: `/shared_bundles/{bundleId}` enforces `bundleId` matching `^canon-[1-9][0-9]{0,2}$`, `jatakaNumber` in `1..547` matching `bundle.jatakaNumber`, verified writer `contributorUid == request.auth.uid`, strict key allowlists, bounded nested lists (`paragraphs <= 20`, `scenes <= 10`, `quiz <= 10`), server timestamps, and immutable `contributorUid`/`createdAt`/`jatakaNumber` on update.

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Reading `/users/alice` or creating `/users/alice/bookmarks/temiya` or creating `/shared_bundles/canon-76` without `request.auth`.
2. **Unverified Email Spoof**: Authenticated user with `email_verified: false` attempting to create `/users/bob` or `/shared_bundles/canon-76`.
3. **Cross-User Read (PII Leak)**: Authenticated verified `bob` calling `get` on `/users/alice/private/profile`.
4. **Cross-User Write (UID Hijack)**: Verified `bob` attempting to write `/users/alice/notes/temiya` with `uid: "bob"` or `/shared_bundles/canon-76` with `contributorUid: "alice"`.
5. **Ghost Field Injection (Shadow Update)**: `alice` creating `/users/alice` or `/shared_bundles/canon-76` with extra shadow field `{ isAdmin: true }`.
6. **UID Field Tampering Inside Subcollection**: `alice` creating `/users/alice/bookmarks/temiya` with `{ uid: "bob" }`.
7. **ID Poisoning**: `alice` attempting to create `/users/alice/notes/invalid id with spaces!` or `/shared_bundles/bad-bundle-id`.
8. **Oversized Array Exhaustion**: `alice` updating `/users/alice` with `readNumbers` of length `> 547` or creating `/shared_bundles/canon-76` with `quiz.size() > 10`.
9. **Oversized Note Content**: `alice` creating `/users/alice/notes/temiya` with `content` > 2000 characters.
10. **Client-Forged Timestamp**: `alice` creating `/users/alice/bookmarks/temiya` or `/shared_bundles/canon-76` with `createdAt: new Date(0)` instead of `request.time`.
11. **Immutable Field Mutation on Update**: `alice` updating `/users/alice/notes/temiya` changing `createdAt` or `taleId`, or updating `/shared_bundles/canon-76` changing `jatakaNumber`.
12. **Type Poisoning on Whitelisted Update Key**: `alice` updating `/users/alice` with `bestQuizScore: "100"` (string instead of int) or `theme: "neon"`, or creating `/shared_bundles/canon-76` with `isPublished: false`.
