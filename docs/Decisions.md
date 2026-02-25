# Decisions Log

## Decision Format
- `ID`: Unique identifier.
- `Status`: Proposed | Accepted | Superseded.
- `Date`: Decision date.
- `Context`: Why this matters.
- `Decision`: What we chose.
- `Consequence`: Tradeoffs and impacts.

## D-001: MVP Platform and Access
- Status: Accepted
- Date: 2026-02-25
- Context: Need fastest path to usable MVP with low ops overhead.
- Decision: Build responsive web app, online-only, backed by Firebase.
- Consequence: Faster delivery; no offline support in MVP.

## D-002: Authentication Method
- Status: Accepted
- Date: 2026-02-25
- Context: Need low-friction onboarding and secure identity.
- Decision: Use Firebase Google login only for MVP.
- Consequence: Simplifies auth UX; excludes non-Google users initially.

## D-003: Module Scope
- Status: Accepted
- Date: 2026-02-25
- Context: Product vision may support multiple modules later.
- Decision: Keep module selector architecture but enable only `GYM` in MVP.
- Consequence: Future extensibility retained with constrained current scope.

## D-004: Routine Model
- Status: Accepted
- Date: 2026-02-25
- Context: Need predictable, simple routine structures.
- Decision: Support routine types `AB` and `PPL` only in MVP.
- Consequence: Clear UX; advanced split customization deferred.

## D-005: Routine vs Session Separation
- Status: Accepted
- Date: 2026-02-25
- Context: Users need day-specific flexibility without damaging templates.
- Decision: Store routine templates separately from workout sessions; session can add/remove exercises.
- Consequence: Clean historical fidelity, slightly more complex data model.

## D-006: Exercise Ordering
- Status: Accepted
- Date: 2026-02-25
- Context: Drag-and-drop order must be deterministic and persistent.
- Decision: Persist explicit numeric order and/or ordered ID arrays.
- Consequence: Requires reorder write logic and conflict handling.

## D-007: Today's Day Detection
- Status: Accepted
- Date: 2026-02-25
- Context: Users should start quickly from active plan.
- Decision: Auto-detect today's routine day from active routine mapping, with optional manual override (P1).
- Consequence: Better default UX, requires clear fallback for atypical schedules.

## D-008: Exercise Source Strategy
- Status: Accepted
- Date: 2026-02-25
- Context: Need predictable data ownership and reduced external dependency for MVP.
- Decision: Exercises are user-created and managed in-app; no third-party exercise API integration in MVP.
- Consequence: Simpler architecture and fewer outages; users must build their own exercise library.

## D-009: Multi-User Readiness
- Status: Accepted
- Date: 2026-02-25
- Context: App must safely support many users from first release.
- Decision: User-scoped Firestore paths + ownerUid + strict security rules and tests.
- Consequence: Strong isolation, tighter constraints on query patterns.

## D-010: Delivery Plan
- Status: Accepted
- Date: 2026-02-25
- Context: Need staged execution with measurable checkpoints.
- Decision: Execute in milestones M0 (foundation), M1 (exercises+routines), M2 (logging), M3 (history/hardening).
- Consequence: Clear sequencing and risk burn-down.

## Open Questions
- Should "today" use user-local timezone from device, profile setting, or server-normalized timezone?
- Should completed sessions be mutable after save (for correction) or append-only with revisions?
- Do we need a default starter exercise pack for first-time users?
