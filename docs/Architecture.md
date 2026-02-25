# Architecture

## 1. System Overview
A responsive web client uses Firebase as BaaS:
- Firebase Authentication (Google) for identity.
- Cloud Firestore for app data.
- Firebase Hosting (or equivalent) for frontend deployment.

Design is online-only, user-isolated, and optimized for rapid MVP iteration.

## 2. High-Level Components
1. Web App (Frontend)
- Auth UI and protected routes.
- Exercise library management.
- Routine management (AB/PPL), drag-and-drop ordering.
- Active routine + today's workout flow.
- Workout logging and history calendar.

2. Firebase Authentication
- Google provider only.
- Supplies UID used as ownership key in Firestore.

3. Firestore
- Stores user profile, exercises, routines, workout sessions.
- Persists routine template and session overrides separately.

## 3. Data Flow
1. Login flow
- User signs in with Google.
- Frontend receives user token and bootstraps user-scoped reads.

2. Exercise setup flow
- User creates custom exercises in personal library.
- Exercise docs are scoped to user and reused by routine/session flows.

3. Routine flow
- User creates routine (AB or PPL) with ordered days and exercises.
- Drag-and-drop modifies `order` and writes to Firestore.
- User marks one routine as active.

4. Daily workout flow
- Frontend computes today's day index from active routine/day mapping.
- Generates workout draft for today from template.
- User may add/remove exercises in session draft only.
- On save, draft becomes immutable workout session record.

5. History flow
- Calendar queries sessions by date range and renders markers.
- Date click loads session details.

## 4. Multi-User Strategy
- Every document contains `ownerUid` (or user-rooted path).
- All queries filtered by authenticated UID.
- Firestore rules enforce `request.auth.uid == resource.data.ownerUid` (or path match).

## 5. Domain Model (Conceptual)
- UserProfile: module selection, preferences.
- Exercise: user-defined exercise metadata.
- Routine: name, type (`AB`/`PPL`), active flag, day templates.
- RoutineDayTemplate: day label and ordered exercises.
- WorkoutSession: actual performed workout for specific date, includes overrides.
- WorkoutExerciseEntry: exercise ref + set list.
- SetEntry: reps, weightKg, optional rpe.

## 6. Scalability and Reliability
- Firestore indexes on owner/date/active flags.
- Paginated history queries by month window.
- Idempotent save semantics for session writes where feasible.

## 7. Security
- Google auth required for all app data operations.
- Strict Firestore rules and rules tests.
- Validate all client writes through schema and rules constraints.

## 8. Observability
- Client and backend logs for critical failures and write errors.
- Operational dashboards: auth failures and write failure rates.

## 9. Deployment Architecture
- Environments: `dev` and `prod` Firebase projects.
- CI pipeline: lint/test/build, deploy hosting+rules.
- Versioned docs and migration notes for schema/rules changes.

## 10. Architecture Constraints
- Online-only; no offline sync conflict resolution in MVP.
- Single module (`GYM`) in UI and domain logic for MVP.
- Exercise catalog is user-created only in MVP.
