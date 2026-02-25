# UI Wireframes (MVP, Mobile-First)

## Navigation Pattern (Recommended)
Use a persistent **bottom navigation** after login/module select:
- `Workout`
- `Exercises`
- `Routines`
- `History`

Rationale: fastest thumb reach for frequent logging actions, minimal hierarchy depth, predictable return path.

## Screen Inventory (7 total)
1. Login
2. Module Select
3. Log Workout (Today)
4. Exercises
5. Routines (List + Create)
6. Routine Builder
7. History (Calendar + Detail Sheet)

---

## 1) Login
Route: `/login`

### Default
```text
+----------------------------------+
|                                  |
|         HabitTracker             |
|      Train. Log. Improve.        |
|                                  |
|  [ Continue with Google ]        |
|                                  |
|  Small text: Secure sign-in      |
|                                  |
+----------------------------------+
```

### States
- Loading: button spinner + disabled button text `Signing in...`
- Error: inline message below button `Sign-in failed. Try again.`
- Empty: not applicable

---

## 2) Module Select
Route: `/app/modules`

### Default
```text
+----------------------------------+
| Select module                    |
|----------------------------------|
| [ GYM ]                          |
| Strength and hypertrophy logging |
|                                  |
|               [ Continue ]       |
+----------------------------------+
```

### States
- Loading: skeleton card for module
- Error: toast `Could not save module. Retry.`
- Empty: not applicable (single module in MVP)

---

## 3) Log Workout (Today)
Route: `/app/workout`

### Default
```text
+----------------------------------+
| Today: Pull      Tue, Feb 25     |
| Active: PPL - V1                 |
|----------------------------------|
| + Add exercise (today only)      |
|----------------------------------|
| Lat Pulldown          [Remove]   |
| Set | Reps | Kg  | RPE           |
| 1   | [10] | [55]| [8 ]          |
| 2   | [8 ] | [60]| [8 ]          |
| + Add set                         |
|----------------------------------|
| Seated Row            [Remove]   |
| ...                              |
|                                  |
| [ Save Workout ] (sticky bottom) |
+----------------------------------+
| Workout | Exercises | Routines...|
+----------------------------------+
```

### States
- Default: auto-select today based on active routine mapping
- Empty (no active routine): card `No active routine` + CTA `Go to Routines`
- Empty (day has no exercises): hint `Add exercise for today`
- Loading: skeleton exercise cards + disabled save
- Error save: inline banner + `Retry Save`
- Validation: reps/kg must be numeric and positive; RPE optional

---

## 4) Exercises
Route: `/app/exercises`

### Default
```text
+----------------------------------+
| Exercises                  [+]   |
|----------------------------------|
| Search [______________]          |
|----------------------------------|
| Bench Press              [Edit]  |
| Incline DB Press         [Edit]  |
| Leg Press                [Edit]  |
|                                  |
+----------------------------------+
| Workout | Exercises | Routines...|
+----------------------------------+
```

### Add/Edit Modal
```text
+------------------------------+
| Add Exercise              [X]|
| Name*       [____________]   |
| Muscle      [____________]   |
| Equipment   [____________]   |
| Notes       [____________]   |
| [ Cancel ]      [ Save ]     |
+------------------------------+
```

### States
- Empty: illustration + `No exercises yet` + CTA `Create first exercise`
- Loading: list skeleton rows
- Error list: full-width retry card
- Delete: confirm dialog

---

## 5) Routines (List + Create)
Route: `/app/routines`

### Default
```text
+----------------------------------+
| Routines                   [+]   |
|----------------------------------|
| PPL - V1       [Active] [Open]   |
| A/B - Home     [Set Active][Open]|
|                                  |
+----------------------------------+
| Workout | Exercises | Routines...|
+----------------------------------+
```

### Create Routine Modal
```text
+------------------------------+
| New Routine               [X]|
| Name*      [____________]    |
| Type       ( ) AB ( ) PPL    |
| [ Cancel ]      [ Create ]   |
+------------------------------+
```

### States
- Empty: `No routines yet` + `Create routine`
- Loading: card skeletons
- Error: toast with retry action
- Delete: confirm dialog, prevent deleting active without reassignment

---

## 6) Routine Builder
Route: `/app/routines/:routineId`

### Default
```text
+----------------------------------+
| PPL - V1                  [Save] |
| Push | Pull | Legs               |
|----------------------------------|
| + Add exercise                   |
|----------------------------------|
| [::] Bench Press         [Remove]|
| [::] Incline DB Press    [Remove]|
| [::] Triceps Pushdown    [Remove]|
|                                  |
+----------------------------------+
```

### States
- Empty day: `No exercises for this day` + add CTA
- Loading: day tab + list skeleton
- Error reorder: toast `Could not reorder` + rollback to prior order
- Drag: clear handle target, ghost row, drop indicator

---

## 7) History (Calendar + Detail Sheet)
Route: `/app/history`

### Default
```text
+----------------------------------+
| History                 < Feb >  |
|----------------------------------|
| Mo Tu We Th Fr Sa Su             |
|  .  .  .  1  2* 3  4             |
|  5  6* 7  8  9 10 11             |
| ... (* = workout day)            |
|----------------------------------|
| Tap a marked day for details     |
+----------------------------------+
| Workout | Exercises | Routines...|
+----------------------------------+
```

### Detail Bottom Sheet (on day select)
```text
+----------------------------------+
| Feb 6, 2026                 [X]  |
| Pull - PPL V1                     |
|----------------------------------|
| Lat Pulldown                      |
| 10x55, 8x60                       |
| Seated Row                        |
| 12x45, 10x50                      |
+----------------------------------+
```

### States
- Empty month: `No workouts this month`
- Loading: calendar skeleton + disabled date taps
- Error: inline retry card

---

## Global UX Notes
- Primary CTA on high-frequency actions is sticky on mobile (`Save Workout`, `Continue`).
- Use clear labels for session-only edits: `today only`.
- Keep destructive actions behind confirmation with explicit target name.
- Show optimistic updates where safe (set add/remove, reorder), rollback on failure.