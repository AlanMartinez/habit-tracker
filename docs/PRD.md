# Product Requirements Document (PRD)

## 1. Product Summary
HabitTracker MVP is a responsive web app for logging gym training. It is online-only, authenticates users with Firebase Google Login, supports a gym module only, and allows structured workout tracking with routine templates and per-day flexibility.

## 2. Goals and Non-Goals
### Goals
- Enable a signed-in user to select the GYM module and start training quickly.
- Support custom routines with 3 or 4 training days per week and editable day names.
- Let users create their own exercises and use them in routines.
- Let users reorder exercises (drag-and-drop), run an active routine, and log sets with reps/weight and optional RIR.
- Auto-detect today's day in the active routine and pre-load today's workout.
- Allow adding/removing exercises for today's workout without mutating the routine template.
- Show workout history in a calendar view.
- Be multi-user ready from day one (strict data isolation by user).

### Non-Goals (MVP)
- Offline mode or local-first behavior.
- Non-GYM modules.
- Third-party exercise catalog integrations.
- Advanced programming (periodization, supersets, rest timers, analytics dashboards).
- Social features and coaching flows.

## 3. Target Users
- Individuals tracking their own gym sessions.
- Users needing simple split-based training plans and fast daily logging.

## 4. Core User Stories
- As a user, I can sign in with Google and only see my own data.
- As a user, I can select the GYM module and start from a modern dashboard.
- As a user, I can create custom exercises in my own library.
- As a user, I can manage routine days and reorder exercises by drag-and-drop.
- As a user, I can start today's workout from my active routine with day auto-detected.
- As a user, I can log multiple sets per exercise with reps, weight (kg), and optional RIR.
- As a user, I can add/remove exercises for today only without changing the saved routine.
- As a user, I can review past workouts in a calendar.

## 5. Functional Requirements
1. Authentication
- Firebase Authentication with Google provider only for MVP.
- If unauthenticated, app routes requiring data are blocked.

2. Module Selection
- Module selector exists, but only `GYM` is available and selectable.
- Module choice is stored per user profile.

3. Exercise Library
- User can create and manage exercise definitions (name required; optional metadata).
- Exercises are user-owned and private by default.
- Routine and session exercise selection comes from this user-owned library.

4. Routine Management
- User can create one or more routines with 3 or 4 weekly training days.
- Routine contains ordered day definitions (editable names) and ordered exercise lists with target reps (single or range) and optional RIR target.
- User can set one routine as active.

5. Drag-and-Drop Ordering
- User can reorder exercises within a routine day using drag-and-drop.
- Reorder persists in Firestore.

6. Active Routine + Today's Day
- App infers today's routine day from active routine and day mapping logic.
- User can open today's generated workout draft.

7. Workout Logging
- User logs workout session with date/time and routine context.
- For each exercise: one or more sets; each set has reps, weightKg, optional RIR.
- Session can be saved and later viewed in history.

8. Day-Specific Exercise Overrides
- For today's workout session, user may add/remove exercises.
- Overrides apply to the session only, not the routine template.

9. History Calendar
- Calendar view by month with workout days marked.
- Selecting a date shows workout details.

10. Multi-User Readiness
- Every persisted entity is namespaced by userId/ownership.
- Firestore security rules enforce read/write only for owner.

## 6. Non-Functional Requirements
- Responsive UX for mobile and desktop browsers.
- Online-only behavior (network required for core features).
- P95 user action latency target: < 600ms for common reads/writes.
- Basic observability for critical errors.

## 7. Success Metrics (MVP)
- 90%+ of signed-in users create an active routine within first session.
- 70%+ of users with active routine log at least one workout per week.
- 70%+ of users create at least 5 exercises in their personal library.

## 8. Acceptance Criteria (MVP Exit)
1. Auth and Access
- Given a logged-out state, protected pages redirect to login.
- Given a logged-in user, data queries return only that user's records.

2. Exercise Library
- User can create, edit, and delete custom exercises.
- Custom exercises are available when configuring routines and daily sessions.

3. Routine Setup
- User can create routines with 3/4 days, set one active, and rename each day.
- Routine day exercises can be reordered and order remains after refresh.

4. Daily Workout Flow
- App identifies today's day for active routine and generates today's workout draft.
- User can add/remove exercises in today's draft without changing routine template.

5. Logging
- User can save workout containing exercises and sets with reps + weightKg; RIR optional.
- Saved workout appears in history calendar on that date.

6. Responsive
- Core flows (login, exercise management, routine setup, log workout, history) are usable on mobile width (>=360px) and desktop.

## 9. Milestone Plan (M0-M3)
### M0 - Foundation
- Project setup, Firebase config, auth scaffold, base routing/layout.
- Firestore collections, indexes draft, security rules baseline.
- Deliverable: user can sign in and reach empty dashboard.

### M1 - Exercises + Routines
- GYM module select.
- Exercise library CRUD.
- Routine CRUD with 3/4 days per week, active routine selection, and day naming.
- Drag-and-drop ordering with persistence.
- Deliverable: user defines exercises and configures active routine end-to-end.

### M2 - Logging
- Today's day auto-detection, workout draft generation.
- Set logging (reps, weightKg, optional RIR), per-day add/remove exercise overrides, and per-session reorder.
- Deliverable: user logs complete workout sessions.

### M3 - History + Hardening
- Calendar history view with workout details.
- Multi-user security validation, QA, release readiness.
- Deliverable: production-ready MVP.

## 10. Risks and Mitigations
- Inconsistent exercise naming by users: add naming guidance and duplicate-name warnings.
- Day auto-detect ambiguity: allow manual day override in UI while preserving default inference.
- Data model drift: lock schema decisions in `FirestoreSchema.md` and `Decisions.md`.


