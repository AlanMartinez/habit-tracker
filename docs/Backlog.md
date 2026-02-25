# Backlog

## Prioritization Model
- `P0`: Required for MVP release.
- `P1`: Important but can ship shortly after MVP.
- `P2`: Nice-to-have.

## Milestone Backlog

## M0 - Foundation
### P0
- Define Firebase projects/environments (dev/prod), config strategy.
- Implement Firebase Google authentication flow.
- Implement protected routing and session bootstrap.
- Define Firestore base collections and ownership fields.
- Write baseline Firestore security rules for per-user isolation.
- Create app shell responsive layout and navigation skeleton.

### Exit Criteria
- User can sign in/out with Google.
- Authenticated user reaches dashboard.
- Unauthorized access to another user's docs is denied by rules tests.

## M1 - Exercises and Routines
### P0
- Implement module selector with only `GYM` enabled.
- Exercise library CRUD (create/edit/delete).
- Routine CRUD: create, edit metadata, delete.
- Support routine types `AB` and `PPL`.
- Day editor for routine (ordered days and exercise slots).
- Drag-and-drop exercise ordering inside routine day and persist order.
- Active routine selection and retrieval.

### P1
- Duplicate routine.
- Confirm dialogs for destructive actions.
- Exercise duplicate-name warning UX.

### Exit Criteria
- User can create custom exercises and use them in routine days.
- User can complete full routine setup and mark one active.
- Exercise order remains stable across reload/devices.

## M2 - Logging
### P0
- Implement today's routine-day auto-detection.
- Generate today's workout draft from active routine.
- Session-level exercise add/remove (non-persistent to template).
- Set logger with reps, weightKg, optional RPE.
- Save workout session and display detail view.

### P1
- Manual day override (when user trains a different day).
- Session notes field.

### Exit Criteria
- User can start from routine and save a full workout.
- Routine template unchanged when session overrides are applied.

## M3 - History and Hardening
### P0
- Calendar history with workout-day markers.
- Date drill-down to session detail.
- Multi-user rule validation and regression tests.
- Add core telemetry/logging and bug triage checklist.

### P1
- Empty-state and edge-case UX polish.

### Exit Criteria
- User can browse historical workouts by calendar.
- MVP acceptance criteria in PRD all pass.

## Cross-Cutting Tasks
- Testing
- Unit tests for day-detection and workout transformers.
- Security rules tests for ownership and query constraints.
- Integration smoke tests for auth -> exercise -> routine -> log -> history flow.

- DevEx
- Seed data script for quick local testing.
- CI checks for lint/test/build and rules deployment validation.

## Deferred (Post-MVP)
- Offline mode.
- Multiple modules beyond GYM.
- Shared/public exercise catalogs.
- Advanced analytics and progression insights.
- Social/community features.
