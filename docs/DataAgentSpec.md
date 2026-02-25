# Data Agent Spec (Firestore Rules and Types)

## Scope
Defines:
- Firestore security rule blueprint for strict per-user isolation.
- TypeScript domain/data types aligned with current MVP docs.

## 1. Firestore Rules Blueprint

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthed() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isAuthed() && request.auth.uid == uid;
    }

    function hasOwnerUid(uid) {
      return request.resource.data.ownerUid == uid;
    }

    function ownerUnchanged() {
      return resource.data.ownerUid == request.resource.data.ownerUid;
    }

    function isValidRoutineType(v) {
      return v == 'AB' || v == 'PPL';
    }

    function isValidModule(v) {
      return v == 'GYM';
    }

    function isValidSetData(d) {
      return d.reps is int
        && d.reps >= 1
        && d.weightKg is number
        && d.weightKg >= 0
        && (!("rpe" in d) || (d.rpe is number && d.rpe >= 1 && d.rpe <= 10));
    }

    match /users/{uid} {
      allow read: if isOwner(uid);
      allow create: if isOwner(uid);
      allow update: if isOwner(uid)
        && isValidModule(request.resource.data.selectedModule);
      allow delete: if false;

      match /exercises/{exerciseId} {
        allow read: if isOwner(uid);
        allow create: if isOwner(uid)
          && hasOwnerUid(uid)
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0;
        allow update: if isOwner(uid)
          && ownerUnchanged()
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0;
        allow delete: if isOwner(uid);
      }

      match /routines/{routineId} {
        allow read: if isOwner(uid);
        allow create: if isOwner(uid)
          && hasOwnerUid(uid)
          && isValidRoutineType(request.resource.data.type);
        allow update: if isOwner(uid)
          && ownerUnchanged()
          && isValidRoutineType(request.resource.data.type);
        allow delete: if isOwner(uid);

        match /days/{dayId} {
          allow read: if isOwner(uid);
          allow create, update: if isOwner(uid)
            && hasOwnerUid(uid);
          allow delete: if isOwner(uid);

          match /exercises/{exerciseItemId} {
            allow read: if isOwner(uid);
            allow create, update: if isOwner(uid)
              && hasOwnerUid(uid)
              && request.resource.data.exerciseId is string
              && request.resource.data.exerciseId.size() > 0;
            allow delete: if isOwner(uid);
          }
        }
      }

      match /workoutSessions/{sessionId} {
        allow read: if isOwner(uid);
        allow create: if isOwner(uid)
          && hasOwnerUid(uid);
        allow update: if isOwner(uid)
          && ownerUnchanged();
        allow delete: if isOwner(uid);

        match /exercises/{sessionExerciseId} {
          allow read: if isOwner(uid);
          allow create, update: if isOwner(uid)
            && hasOwnerUid(uid)
            && request.resource.data.nameSnapshot is string
            && request.resource.data.nameSnapshot.size() > 0;
          allow delete: if isOwner(uid);

          match /sets/{setId} {
            allow read: if isOwner(uid);
            allow create, update: if isOwner(uid)
              && hasOwnerUid(uid)
              && isValidSetData(request.resource.data);
            allow delete: if isOwner(uid);
          }
        }
      }
    }
  }
}
```

## 2. TypeScript Types Blueprint

```ts
export type RoutineType = 'AB' | 'PPL';
export type ModuleType = 'GYM';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  selectedModule: ModuleType;
  activeRoutineId?: string;
  createdAt: unknown; // Firestore Timestamp
  updatedAt: unknown; // Firestore Timestamp
}

export interface Exercise {
  ownerUid: string;
  name: string;
  primaryMuscle?: string;
  equipment?: string;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Routine {
  ownerUid: string;
  name: string;
  type: RoutineType;
  isActive: boolean;
  dayOrder: string[];
  createdAt: unknown;
  updatedAt: unknown;
}

export interface RoutineDay {
  ownerUid: string;
  label: string;
  order: number;
  exerciseOrder: string[];
  createdAt: unknown;
  updatedAt: unknown;
}

export interface RoutineDayExercise {
  ownerUid: string;
  exerciseId: string;
  nameSnapshot: string;
  order: number;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface WorkoutSession {
  ownerUid: string;
  date: string; // YYYY-MM-DD
  startedAt: unknown;
  endedAt?: unknown;
  routineId?: string;
  routineType?: RoutineType;
  routineDayId?: string;
  routineDayLabel?: string;
  isFromActiveRoutine: boolean;
  hasSessionOverrides: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface SessionExercise {
  ownerUid: string;
  exerciseId?: string;
  nameSnapshot: string;
  order: number;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface SessionSet {
  ownerUid: string;
  order: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  createdAt: unknown;
  updatedAt: unknown;
}
```

## 3. Validation Notes
- `selectedModule` must remain `GYM` in MVP.
- `routine.type` restricted to `AB` or `PPL`.
- `reps >= 1`, `weightKg >= 0`, `rpe` optional `1..10`.
- `ownerUid` must always match authenticated UID.

## 4. Recommended Rules Tests
- User A cannot read/write User B docs in any collection/subcollection.
- Invalid `routine.type` is denied.
- Empty exercise name is denied.
- Invalid set values (`reps=0`, `weightKg<0`, `rpe=11`) are denied.
- Owner UID mutation on update is denied.
