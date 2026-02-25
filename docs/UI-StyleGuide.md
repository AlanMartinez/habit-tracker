# UI Style Guide (Tailwind-Friendly)

## Design Principles
- Mobile-first: optimize for 360px width first, then scale.
- Fast logging: minimal taps, clear grouped inputs.
- Strong hierarchy: bold headlines, muted metadata, clear CTA.
- Visual identity: layered surfaces, gradient accents, and modern cards.

## Theme System
Use CSS variables with light/dark mode via `data-theme`.

Core tokens:
- `--surface-0`, `--surface-1`, `--surface-2`, `--surface-3`
- `--text-strong`, `--text`, `--text-muted`
- `--border`, `--border-muted`, `--border-strong`
- `--accent`, `--accent-hover`, `--accent-soft`, `--accent-text`
- `--card-shadow`

Rules:
- All shared components should consume semantic tokens, not hardcoded palette classes.
- Theme toggle must be globally accessible in app chrome.

## Typography
- Font family: `"Plus Jakarta Sans", "Manrope", "Segoe UI", sans-serif`
- Headings: semibold/bold
- Body: regular/medium

Type scale:
- `text-xs`: metadata, helper text
- `text-sm`: body/default forms
- `text-base`: card titles
- `text-xl+`: page and hero titles

## Layout and Spacing
- Screen padding: `px-4`
- Section rhythm: `space-y-4`
- Card padding: `p-4`
- Sticky CTA for high-value actions (`Save Workout`)

## Components
- Cards: `rounded-2xl`, token border/background, elevated shadow.
- Buttons:
  - Primary: accent fill, high contrast text.
  - Secondary: neutral surface + border.
  - Ghost: transparent with subtle hover surface.
- Inputs/selects/textareas:
  - Label above field.
  - Min touch height ~44px.
  - Accent focus ring and error states.
- Badges:
  - Use explicit status coloring + text.

## Workout UX Rules
- Workout tab is a dashboard; logging starts only after `Start workout`.
- Exercise cards support collapse/expand.
- Exercise list supports drag/drop reorder per session.
- Session order changes never mutate routine templates.

## Routine Builder UX Rules
- Routine creation requires `name + days/week (3 or 4)`.
- Every day must be nameable.
- Add exercise from direct list rows with inline `Add` action.
- Each exercise supports target reps (`single` or `range`) and optional `RIR`.
- Drag/drop order must be persistent.

## Accessibility Baselines
- WCAG AA contrast targets for text and controls.
- Touch target >= 44x44.
- Visible keyboard focus ring.
- Status meaning cannot rely on color alone.
