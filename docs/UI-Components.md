# UI Components (Reusable, Mobile-First)

## Layout and Navigation
- `AppShell`
- Purpose: wraps authenticated screens with top app bar + bottom nav.
- Props/Config: title, optional right action, active bottom-nav item.

- `BottomNav`
- Items: `Workout`, `Exercises`, `Routines`, `History`.
- Behavior: fixed at bottom on mobile, static rail/footer variant on desktop.

- `TopBar`
- Includes page title, optional back button, optional overflow menu.

## Buttons and Actions
- `ButtonPrimary`
- Use: main actions (`Save Workout`, `Continue`, `Create`).
- Style: solid brand background, high contrast text.

- `ButtonSecondary`
- Use: non-destructive secondary actions.

- `ButtonGhost`
- Use: inline actions in cards/lists (`Edit`, `Set Active`).

- `IconButton`
- Use: compact actions (`+`, close, overflow).

- `FabAdd`
- Optional for lists (`Exercises`, `Routines`) on mobile.

## Form Controls
- `TextInput`
- Variants: default, error, disabled.
- Supports label, hint, error text.

- `NumberInput`
- Use for reps, kg, optional RPE.
- Behavior: numeric keyboard on mobile.

- `SelectInput`
- Use for known value sets when needed.

- `SegmentedControl`
- Use for routine type (`AB`, `PPL`) and day tabs.

- `SearchField`
- Leading search icon, clear button.

## Data Display
- `Card`
- Base container for routine, exercise, workout sections.

- `ListItem`
- Reusable row with title, subtitle, trailing actions.

- `Badge`
- States: `Active`, `AB`, `PPL`, `Today`.

- `Divider`
- Subtle list/card separators.

## Workout Logging
- `WorkoutHeaderCard`
- Shows date, detected day, active routine.

- `ExerciseWorkoutCard`
- Contains exercise title, remove action, set table.

- `SetRow`
- Fields: set index, reps, kg, optional RPE, delete row action.

- `AddSetButton`
- Inline control inside exercise card.

- `StickyActionBar`
- Primary action pinned above bottom nav.

## Routine Builder
- `DayTabs`
- Tab switcher for routine days.

- `ExercisePickerSheet`
- Bottom sheet to select exercises from library.

- `DraggableList`
- Reorder exercises with drag handle and drop indicator.

- `DragHandle`
- Explicit grip affordance for touch/mouse.

## Feedback and States
- `EmptyState`
- Title, supporting text, optional CTA.

- `LoadingSkeleton`
- Variants: list row, card, calendar.

- `InlineError`
- For section-level failures with retry button.

- `Toast`
- Short non-blocking feedback (`Saved`, `Retry failed`).

- `ConfirmDialog`
- For destructive actions.

## Overlays
- `Modal`
- For create/edit forms where context switch should be limited.

- `BottomSheet`
- Mobile-first details/actions (`History detail`, `Exercise picker`).

## Calendar
- `CalendarMonth`
- Month grid with workout-day markers.

- `DayMarker`
- Dot or filled indicator for logged workout days.

## Component Usage Rules
- One primary action per screen section; avoid multiple competing primary buttons.
- Prefer bottom sheets on mobile for contextual tasks, modals on larger breakpoints.
- Use optimistic UI for quick operations (set add/remove, reorder), with visible rollback on error.
- Keep hit targets >= 44px for touch controls.
- Use consistent verb labels: `Create`, `Save`, `Delete`, `Retry`, `Set Active`.