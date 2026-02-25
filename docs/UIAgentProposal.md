# UI Agent Proposal

## Scope
Design proposal for MVP screens and reusable components aligned to:
- Responsive web, online-only.
- Google login.
- GYM-only module.
- User-created exercise library.
- AB/PPL routines with drag-and-drop ordering.
- Active routine, auto-detect today's day.
- Workout logging with sets (reps, weightKg, optional RPE).
- Day-specific add/remove exercise overrides.
- History calendar.

## Route Map
- `/login`
- `/app/dashboard`
- `/app/exercises`
- `/app/routines`
- `/app/routines/:routineId`
- `/app/workout/today`
- `/app/history`
- `/app/history/:date`

## Screen Specs

## 1. Login Screen (`/login`)
Purpose: Authenticate via Google.

Key UI:
- Brand/title.
- Google sign-in button.
- Minimal error state for popup-blocked/auth failure.

Acceptance:
- Successful login redirects to `/app/dashboard`.
- Logged-in user cannot revisit login unless signed out.

## 2. Dashboard (`/app/dashboard`)
Purpose: Entry point and quick status.

Key UI:
- Active routine card (name, type, next/today day label).
- "Start Today's Workout" primary CTA.
- Secondary CTAs: "Manage Exercises", "Manage Routines", "View History".
- Empty state when no active routine exists.

Acceptance:
- If active routine exists, CTA opens today's draft.
- If no active routine, CTA routes to routine setup.

## 3. Exercise Library (`/app/exercises`)
Purpose: User creates and manages own exercises.

Key UI:
- List/table: exercise name, primary muscle, equipment, updatedAt.
- Search/filter by name.
- "Add Exercise" button opening modal/sheet.
- Per-row actions: edit, delete.

Form fields:
- Name (required).
- Primary muscle (optional).
- Equipment (optional).
- Notes (optional).

Validation:
- Name required and trimmed.
- Duplicate warning (non-blocking in MVP).

Acceptance:
- CRUD works and updates list without full refresh.
- Changes visible in routine day exercise picker.

## 4. Routine List (`/app/routines`)
Purpose: Manage routines and active selection.

Key UI:
- Cards/list of routines with type badge (`AB`/`PPL`).
- Actions: open, set active, delete.
- "New Routine" action with type selector.

Acceptance:
- Exactly one active routine at a time.
- Active marker persists after reload.

## 5. Routine Editor (`/app/routines/:routineId`)
Purpose: Configure days and exercise ordering.

Key UI:
- Header: routine name, type, active toggle action.
- Day tabs/accordion (A/B or Push/Pull/Legs).
- Exercise picker from user library.
- Ordered exercise list per day with drag handle.
- Remove exercise action.

DnD behavior:
- Pointer + keyboard support baseline.
- Reorder persisted immediately (optimistic + rollback on failure).

Acceptance:
- Reordered list remains stable after refresh.
- Exercise add/remove updates day template only.

## 6. Today's Workout (`/app/workout/today`)
Purpose: Execute today's training session.

Key UI:
- Auto-detected day banner (e.g., "Today: Pull").
- Session exercise list seeded from routine day.
- "Add Exercise for Today" action (session-only).
- Remove action for session exercises.
- Per-exercise set editor table:
  - reps
  - weight (kg)
  - RPE (optional)
  - add/remove set row
- Save workout CTA.

Acceptance:
- Session modifications do not mutate routine template.
- Saving persists session and navigates to history detail or confirmation.

## 7. History Calendar (`/app/history`)
Purpose: Browse past workouts by date.

Key UI:
- Month calendar with workout-day markers.
- Date select opens detail panel/route.

Acceptance:
- Dates with workouts are visibly marked.
- Selecting a date shows workout sessions for that day.

## 8. History Detail (`/app/history/:date`)
Purpose: Inspect logged workout content.

Key UI:
- Session summary (date, day label, routine).
- Exercise list with set breakdown.

Acceptance:
- Data reflects saved session snapshot (not current routine).

## Component Inventory
- `AuthGate`
- `AppShell` (top nav + mobile bottom nav)
- `EmptyState`
- `PrimaryCTA`
- `RoutineCard`
- `ExerciseList`
- `ExerciseFormModal`
- `ExercisePicker`
- `DayTabs`
- `DraggableExerciseList`
- `WorkoutExerciseCard`
- `SetEditorGrid`
- `CalendarView`
- `SessionDetailPanel`
- `ConfirmDialog`
- `Toast`

## UX Rules
- Keep primary actions sticky on mobile where useful (save/start).
- Confirm destructive actions (delete routine/exercise, discard workout edits).
- Use clear labels for template vs session-only changes.
- Show network failure toasts with retry actions.

## Responsive Breakpoints
- Mobile: 360-767px.
- Tablet: 768-1023px.
- Desktop: 1024px+.

## UI Delivery Milestones
- M0: Auth + shell + dashboard skeleton.
- M1: Exercise library + routine list/editor + DnD.
- M2: Today's workout flow + set editor + session overrides.
- M3: History calendar + detail polish + error/empty-state hardening.
