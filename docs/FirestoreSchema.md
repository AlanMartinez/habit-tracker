# Firestore Schema

## 1. Principles
- Multi-tenant by user ownership.
- Keep routine templates separate from workout session data.
- Store order explicitly for deterministic drag-and-drop persistence.
- Record timestamps for auditing and sync.

## 2. Collection Structure

## `/users/{uid}`
User profile and app-level preferences.

Suggested fields:
- `displayName: string`
- `email: string`
- `photoURL: string?`
- `selectedModule: "GYM"`
- `activeRoutineId: string?`
- `createdAt: timestamp`
- `updatedAt: timestamp`

## `/users/{uid}/exercises/{exerciseId}`
User-owned exercise library entries.

Suggested fields:
- `ownerUid: string` (== uid)
- `name: string`
- `primaryMuscle: string?`
- `equipment: string?`
- `notes: string?`
- `createdAt: timestamp`
- `updatedAt: timestamp`

## `/users/{uid}/routines/{routineId}`
Routine templates owned by user.

Suggested fields:
- `ownerUid: string` (== uid)
- `name: string`
- `type: "CUSTOM" | "AB" | "PPL"` (legacy AB/PPL still supported)
- `daysPerWeek: number` (`3 | 4 | 5`)
- `isActive: boolean`
- `dayOrder: string[]` (ordered day ids, usually `day-1..day-N`)
- `createdAt: timestamp`
- `updatedAt: timestamp`

## `/users/{uid}/routines/{routineId}/days/{dayId}`
Per-day template details.

Suggested fields:
- `ownerUid: string`
- `label: string` (e.g., `Day 1`, `Upper`, `Legs`)
- `order: number`
- `exerciseOrder: string[]`
- `createdAt: timestamp`
- `updatedAt: timestamp`

## `/users/{uid}/routines/{routineId}/days/{dayId}/exercises/{exerciseItemId}`
Exercise template entry for a routine day.

Suggested fields:
- `ownerUid: string`
- `exerciseId: string`
- `nameSnapshot: string`
- `targetRepsMin: number`
- `targetRepsMax: number`
- `targetSets: number`
- `order: number`
- `createdAt: timestamp`
- `updatedAt: timestamp`

## `/users/{uid}/workoutSessions/{sessionId}`
Logged workout instance.

Suggested fields:
- `ownerUid: string`
- `date: string` (ISO `YYYY-MM-DD`)
- `startedAt: timestamp`
- `endedAt: timestamp?`
- `routineId: string?`
- `routineType: "CUSTOM" | "AB" | "PPL" | null`
- `routineDayId: string?`
- `routineDayLabel: string?`
- `isFromActiveRoutine: boolean`
- `hasSessionOverrides: boolean`
- `createdAt: timestamp`
- `updatedAt: timestamp`

## `/users/{uid}/workoutSessions/{sessionId}/exercises/{sessionExerciseId}`
Exercises performed in the session.

Suggested fields:
- `ownerUid: string`
- `exerciseId: string?`
- `nameSnapshot: string`
- `order: number`
- `notes: string?`
- `createdAt: timestamp`
- `updatedAt: timestamp`

## `/users/{uid}/workoutSessions/{sessionId}/exercises/{sessionExerciseId}/sets/{setId}`
Set-level log entries.

Suggested fields:
- `ownerUid: string`
- `order: number`
- `reps: number`
- `weightKg: number`
- `rpe: number?` (used as RIR input in UI)
- `createdAt: timestamp`
- `updatedAt: timestamp`
