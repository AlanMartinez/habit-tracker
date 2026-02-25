# User Flows (MVP)

## Navigation Model
- Unauthenticated: Login only.
- First authenticated step: Home dashboard (GYM context).
- Main app tabs:
  - `Workout`
  - `Exercises`
  - `Routines`
  - `History`

## Flow 1: Exercises (Optional Metadata)
1. User opens `Exercises`.
2. User creates exercise with required `Name`.
3. `Muscle`, `Equipment`, and `Notes` are optional and may be empty.
4. Exercise is immediately available in Routine Builder and Workout ad-hoc add.

## Flow 2: Routine Creation
1. User opens `Routines`.
2. User creates routine with:
   - `name`
   - `days per week` (`3`, `4`, or `5`)
3. Routine is created with day slots (`Day 1..N`) and can be set active.

## Flow 3: Routine Builder
1. User renames each routine day if desired.
2. User selects a day tab.
3. User picks exercise from library list and taps `Add`.
4. Before adding, user must define:
   - rep range (`min reps`, `max reps`)
   - number of sets
5. User can reorder day exercises with drag-and-drop.

## Flow 4: Workout Start
1. User opens `Workout` dashboard.
2. User taps `Start workout`.
3. App asks user to select which routine day to perform.
4. App opens log page and preloads exercises for that selected day.

## Flow 5: Workout Log
1. Exercise cards render with default set rows (based on routine set target).
2. Per set, user can log:
   - `reps`
   - `kg`
   - `RIR` (optional)
3. User can add ad-hoc exercise and reorder exercise cards for this session.
4. User saves workout.

Rules:
- Session edits do not mutate routine templates.
- Save flow should be resilient (no crash on empty optional fields).

## Flow 6: History by Month
1. User opens `History`.
2. App queries Firestore workouts for selected month.
3. Calendar marks days with workouts.
4. User taps a marked day to open session detail drawer.
