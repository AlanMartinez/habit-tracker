import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Alert, AppShell, Badge, Button, EmptyState } from '../../shared/components'
import { cn } from '../../shared/lib/cn'
import {
  finishWorkout,
  getExerciseHistoryForWorkout,
  getExerciseMachines,
  getRoutineDayTemplateDraft,
  getTodayWorkoutDraft,
  saveWorkout,
  type WorkoutDraft,
} from './workout.data'
import type { ExerciseHistory } from '../../shared/types/firestore'

type WorkoutSet = {
  id: string
  reps: string
  kg: string
  rir: string
  machineId?: string
  machineLabel?: string
  isDropset?: boolean
}

type WorkoutExercise = {
  id: string
  sourceExerciseId?: string
  name: string
  collapsed: boolean
  sets: WorkoutSet[]
  availableMachines: Array<{ id: string; label: string }>
  targetRepsMin?: number
  targetRepsMax?: number
  targetSets?: number
  linkedExerciseItemId?: string
  linkedExerciseId?: string
  linkedName?: string
  linkedAvailableMachines?: Array<{ id: string; label: string }>
  selectedAlternative: 'A' | 'B'
}

const toId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const createSet = (defaultMachine?: { id: string; label: string }): WorkoutSet => ({
  id: toId(),
  reps: '',
  kg: '',
  rir: '',
  machineId: defaultMachine?.id,
  machineLabel: defaultMachine?.label,
})

const reorderItems = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex) return items
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

const toIntegerText = (value: string): string => value.replace(/[^0-9]/g, '')

const toDecimalText = (value: string): string => {
  const normalized = value.replace(',', '.')
  const digitsAndDots = normalized.replace(/[^0-9.]/g, '')
  const [integerPart, ...decimals] = digitsAndDots.split('.')
  if (decimals.length === 0) return integerPart
  return `${integerPart}.${decimals.join('')}`
}

const mapDraftToExercise = (item: WorkoutDraft['exercises'][number]): WorkoutExercise => {
  const defaultMachine = item.availableMachines[0]
  return {
    id: item.id,
    sourceExerciseId: item.exerciseId,
    name: item.nameSnapshot,
    collapsed: true,
    availableMachines: item.availableMachines,
    targetRepsMin: item.targetRepsMin,
    targetRepsMax: item.targetRepsMax,
    targetSets: item.targetSets,
    linkedExerciseItemId: item.linkedExerciseItemId,
    linkedExerciseId: item.linkedExerciseId,
    linkedName: item.linkedNameSnapshot,
    linkedAvailableMachines: item.linkedAvailableMachines,
    selectedAlternative: 'A',
    sets: item.sets.length > 0
      ? item.sets.map((set) => ({
          id: set.id,
          reps: set.reps > 1 ? String(set.reps) : '',
          kg: set.weightKg > 0 ? String(set.weightKg) : '',
          rir: (set.rpe ?? 1) > 1 ? String(set.rpe ?? 1) : '',
          machineId: set.machineId ?? defaultMachine?.id,
          machineLabel: set.machineLabel ?? defaultMachine?.label,
          isDropset: set.isDropset ?? false,
        }))
      : [createSet(defaultMachine)],
  }
}

const parseNonNegativeNumber = (value: string): number => {
  const trimmed = value.trim()
  if (!trimmed) return 0
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

const parsePositiveNumber = (value: string, fallback: number): number => {
  const parsed = parseNonNegativeNumber(value)
  return parsed < 1 ? fallback : parsed
}

const getCollapsedSummary = (exercise: WorkoutExercise): string => {
  const count = exercise.sets.length
  const primaryKg = exercise.sets.find((s) => s.kg)?.kg
  const primaryReps = exercise.sets.find((s) => s.reps)?.reps
  const parts: string[] = [`${count} ${count === 1 ? 'set' : 'sets'}`]
  if (primaryReps) parts.push(`${primaryReps} reps`)
  if (primaryKg) parts.push(`${primaryKg}kg`)
  return parts.join(' · ')
}

const formatTarget = (exercise: WorkoutExercise): string | null => {
  const { targetSets, targetRepsMin, targetRepsMax } = exercise
  if (!targetSets && !targetRepsMin) return null
  const setsLabel = targetSets ? `${targetSets} x ` : ''
  if (targetRepsMin && targetRepsMax && targetRepsMin !== targetRepsMax) {
    return `${setsLabel}${targetRepsMin}-${targetRepsMax} reps`
  }
  if (targetRepsMin) {
    return `${setsLabel}${targetRepsMin} reps`
  }
  return `${targetSets} sets`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconGrip = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
    <circle cx="5.5" cy="4" r="1.2" />
    <circle cx="5.5" cy="8" r="1.2" />
    <circle cx="5.5" cy="12" r="1.2" />
    <circle cx="10.5" cy="4" r="1.2" />
    <circle cx="10.5" cy="8" r="1.2" />
    <circle cx="10.5" cy="12" r="1.2" />
  </svg>
)

const IconChevronRight = ({ className }: { className?: string }) => (
  <svg className={cn('h-4 w-4', className)} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconX = ({ className }: { className?: string }) => (
  <svg className={cn('h-3.5 w-3.5', className)} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconPlus = ({ className }: { className?: string }) => (
  <svg className={cn('h-5 w-5', className)} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconHistory = () => (
  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconDropset = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path d="M12 5v14M5 15l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const WorkoutSkeleton = () => (
  <div className="space-y-3 pt-1">
    <div className="h-11 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-[72px] animate-pulse rounded-3xl bg-[var(--surface-2)]" style={{ animationDelay: `${i * 80}ms` }} />
    ))}
  </div>
)

// ─── Number input ─────────────────────────────────────────────────────────────

type NumInputProps = {
  value: string
  onChange: (v: string) => void
  onFocus: () => void
  label: string
  decimal?: boolean
}

const NumInput = ({ value, onChange, onFocus, label, decimal }: NumInputProps) => (
  <input
    aria-label={label}
    className="h-11 w-full rounded-xl border border-[var(--border-muted)] bg-[var(--surface-1)] px-1 text-center text-[15px] font-semibold tabular-nums text-[var(--text-strong)] outline-none transition-all duration-150 focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    inputMode={decimal ? 'decimal' : 'numeric'}
    onChange={(e) => onChange(decimal ? toDecimalText(e.target.value) : toIntegerText(e.target.value))}
    onFocus={onFocus}
    pattern={decimal ? undefined : '[0-9]*'}
    placeholder="–"
    step={decimal ? 0.5 : undefined}
    type="number"
    value={value}
  />
)

// ─── Exercise card ────────────────────────────────────────────────────────────

type ExerciseCardProps = {
  exercise: WorkoutExercise
  index: number
  isDragging: boolean
  history: ExerciseHistory | 'loading' | null | undefined
  onExpand: () => void
  onRemove: () => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onUpdateSet: (setId: string, key: 'reps' | 'kg' | 'rir', value: string) => void
  onClearDefault: (setId: string, key: 'reps' | 'kg' | 'rir') => void
  onToggleDropset: (setId: string) => void
  onSelectMachine: (machineId: string) => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onSwitchAlternative?: () => void
  linkedName?: string
  selectedAlternative?: 'A' | 'B'
}

const ExerciseCard = ({
  exercise,
  index,
  isDragging,
  history,
  onExpand,
  onRemove,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onClearDefault,
  onToggleDropset,
  onSelectMachine,
  onDragStart,
  onDragOver,
  onDrop,
  onSwitchAlternative,
  linkedName,
  selectedAlternative,
}: ExerciseCardProps) => {
  const activeMachineId = exercise.sets[0]?.machineId
  const targetLabel = formatTarget(exercise)

  return (
    <div
      className={cn(
        'rounded-3xl border bg-[var(--surface-1)] shadow-[var(--card-shadow)] backdrop-blur-md transition-all duration-200',
        isDragging ? 'scale-[0.97] border-[var(--accent)] opacity-50 ring-2 ring-[var(--accent-soft)]' : 'border-[var(--border)]',
        !exercise.collapsed && 'border-[var(--border-strong)] ring-1 ring-[var(--accent-soft)]',
      )}
      draggable
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      {/* ── Collapsed header ── */}
      <div className={cn('flex items-center gap-2.5 px-4', exercise.collapsed ? 'py-4' : 'py-3.5 pb-2')}>
        {/* Drag handle */}
        <span className="shrink-0 cursor-grab text-[var(--text-muted)] active:cursor-grabbing">
          <IconGrip />
        </span>

        {/* Number badge */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[11px] font-bold tabular-nums text-[var(--accent-text)]">
          {index + 1}
        </span>

        {/* Name + summary */}
        <button
          className="min-w-0 flex-1 text-left"
          onClick={onExpand}
          type="button"
        >
          <p className="truncate text-[15px] font-semibold leading-tight text-[var(--text-strong)]">
            {selectedAlternative === 'B' && linkedName ? linkedName : exercise.name}
          </p>
          {exercise.collapsed && (
            <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)]">
              {getCollapsedSummary(exercise)}
            </p>
          )}
          {exercise.collapsed && targetLabel && (
            <Badge className="mt-1 self-start" tone="info">
              Target: {targetLabel}
            </Badge>
          )}
        </button>

        {/* A/B toggle */}
        {linkedName && (
          <div className="flex items-center gap-1">
            <button
              className={cn(
                'rounded-full px-3 py-0.5 text-xs font-semibold transition-all duration-150',
                selectedAlternative === 'A'
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
              )}
              onClick={(e) => { e.stopPropagation(); onSwitchAlternative?.(); }}
              type="button"
            >
              A
            </button>
            <button
              className={cn(
                'rounded-full px-3 py-0.5 text-xs font-semibold transition-all duration-150',
                selectedAlternative === 'B'
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
              )}
              onClick={(e) => { e.stopPropagation(); onSwitchAlternative?.(); }}
              type="button"
            >
              B
            </button>
          </div>
        )}

        {/* Chevron */}
        <button
          aria-label={exercise.collapsed ? 'Expand exercise' : 'Collapse exercise'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-strong)]"
          onClick={onExpand}
          type="button"
        >
          <IconChevronRight
            className={cn('transition-transform duration-200', !exercise.collapsed && 'rotate-90')}
          />
        </button>

        {/* Remove */}
        <button
          aria-label={`Remove ${exercise.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
          onClick={onRemove}
          type="button"
        >
          <IconX />
        </button>
      </div>

      {/* ── Expanded content ── */}
      {!exercise.collapsed && (
        <div className="space-y-3 px-4 pb-4">
          {/* Target + Machine chips row */}
          {(targetLabel || exercise.availableMachines.length > 0) && (
            <div className="flex items-center gap-2">
              {targetLabel && (
                <Badge className="shrink-0" tone="info">
                  Target: {targetLabel}
                </Badge>
              )}
              {exercise.availableMachines.length > 0 && (
                <div className={cn('flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', targetLabel && 'ml-auto')}>
                  {exercise.availableMachines.map((machine) => {
                    const isSelected = activeMachineId === machine.id
                    return (
                      <button
                        className={cn(
                          'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150',
                          isSelected
                            ? 'bg-[var(--accent)] text-white shadow-[0_2px_10px_rgba(124,58,237,0.35)]'
                            : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]',
                        )}
                        key={machine.id}
                        onClick={() => onSelectMachine(machine.id)}
                        type="button"
                      >
                        {machine.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* History bar */}
          {exercise.sourceExerciseId && (
            <>
              {history === 'loading' && (
                <div className="h-7 animate-pulse rounded-xl bg-[var(--surface-2)]" />
              )}
              {history && history !== 'loading' && history.lastSessionSets.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2">
                  <IconHistory />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Última
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-strong)]">
                    {history.lastSessionSets.map((s) => `${s.reps}×${s.weightKg}kg`).join(' / ')}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Set grid header */}
          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem_2.5rem] items-center gap-1.5 px-0.5">
            <span className="text-center text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">#</span>
            <span className="text-center text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Reps</span>
            <span className="text-center text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">kg</span>
            <span className="text-center text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">RIR</span>
            <span className="text-center text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">DS</span>
            <span />
          </div>

          {/* Set rows */}
          <div className="space-y-1.5">
            {exercise.sets.map((set, setIndex) => (
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem_2.5rem] items-center gap-1.5" key={set.id}>
                {/* Set number */}
                <div className="flex h-11 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
                  {setIndex + 1}
                </div>

                {/* Reps */}
                <NumInput
                  label={`Set ${setIndex + 1} reps for ${exercise.name}`}
                  onChange={(v) => onUpdateSet(set.id, 'reps', v)}
                  onFocus={() => onClearDefault(set.id, 'reps')}
                  value={set.reps}
                />

                {/* Kg */}
                <NumInput
                  decimal
                  label={`Set ${setIndex + 1} kg for ${exercise.name}`}
                  onChange={(v) => onUpdateSet(set.id, 'kg', v)}
                  onFocus={() => onClearDefault(set.id, 'kg')}
                  value={set.kg}
                />

                {/* RIR */}
                <NumInput
                  label={`Set ${setIndex + 1} RIR for ${exercise.name}`}
                  onChange={(v) => onUpdateSet(set.id, 'rir', v)}
                  onFocus={() => onClearDefault(set.id, 'rir')}
                  value={set.rir}
                />

                {/* Dropset toggle */}
                <button
                  aria-label={`Toggle dropset for set ${setIndex + 1}`}
                  aria-pressed={set.isDropset === true}
                  className={cn(
                    'flex h-11 w-8 items-center justify-center rounded-xl transition',
                    set.isDropset
                      ? 'bg-[var(--accent)] text-white shadow-[0_2px_8px_rgba(124,58,237,0.35)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--accent-text)]',
                  )}
                  onClick={() => onToggleDropset(set.id)}
                  type="button"
                >
                  <IconDropset />
                </button>

                {/* Delete set */}
                <button
                  aria-label={`Remove set ${setIndex + 1}`}
                  className="flex h-11 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                  onClick={() => onRemoveSet(set.id)}
                  type="button"
                >
                  <IconX />
                </button>
              </div>
            ))}
          </div>

          {/* Add set button */}
          <button
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] py-2.5 text-xs font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)]"
            onClick={onAddSet}
            type="button"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Add set
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const LogWorkoutPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [context, setContext] = useState<WorkoutDraft | null>(null)
  const [items, setItems] = useState<WorkoutExercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [savedItemsSnapshot, setSavedItemsSnapshot] = useState<string | null>(null)
  const [hasOverrides, setHasOverrides] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [defaultExerciseNames, setDefaultExerciseNames] = useState<string[]>([])
  const [exerciseHistories, setExerciseHistories] = useState<Record<string, ExerciseHistory | 'loading' | null>>({})

  const hasChanges = savedItemsSnapshot === null || JSON.stringify(items) !== savedItemsSnapshot

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setContext(null)
        setItems([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const dayId = searchParams.get('dayId') ?? undefined
        const draft = await getTodayWorkoutDraft(user.uid, { routineDayId: dayId })

        let nextDraft = draft
        if (dayId && draft.routineId && draft.exercises.length === 0) {
          const template = await getRoutineDayTemplateDraft(user.uid, draft.routineId, dayId)
          if (template.exercises.length > 0) {
            nextDraft = {
              ...draft,
              routineDayId: template.routineDayId,
              routineDayLabel: template.routineDayLabel ?? draft.routineDayLabel,
              exercises: template.exercises,
            }
          }
        }

        setContext(nextDraft)
        if (nextDraft.routineId && nextDraft.routineDayId) {
          const template = await getRoutineDayTemplateDraft(
            user.uid,
            nextDraft.routineId,
            nextDraft.routineDayId,
          )
          setDefaultExerciseNames(template.exercises.map((item) => item.nameSnapshot))
        } else {
          setDefaultExerciseNames([])
        }
        setItems(nextDraft.exercises.map(mapDraftToExercise))
        setHasOverrides(nextDraft.hasSessionOverrides)
        setSelectedExercise(nextDraft.availableExercises[0]?.id ?? '')
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Unable to load workout log.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [user, searchParams])

  const selectedExerciseItem = useMemo(
    () => context?.availableExercises.find((exercise) => exercise.id === selectedExercise),
    [context, selectedExercise],
  )

  const deduplicatedItems = useMemo(() => {
    const hiddenIds = new Set<string>()
    for (const item of items) {
      if (item.linkedExerciseItemId && !hiddenIds.has(item.id)) {
        hiddenIds.add(item.linkedExerciseItemId)
      }
    }
    return items.filter((item) => !hiddenIds.has(item.id))
  }, [items])

  const addAdHocExercise = async () => {
    if (!selectedExerciseItem || !user) {
      return
    }

    const availableMachines = await getExerciseMachines(user.uid, selectedExerciseItem.id)
    const defaultMachine = availableMachines[0]

    setHasOverrides(true)
    setItems((prev) => [
      ...prev,
      {
        id: toId(),
        sourceExerciseId: selectedExerciseItem.id,
        name: selectedExerciseItem.name,
        collapsed: false,
        availableMachines,
        sets: [createSet(defaultMachine)],
        selectedAlternative: 'A' as const,
      },
    ])
  }

  const removeExercise = (id: string) => {
    setHasOverrides(true)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addSet = (exerciseId: string) => {
    setHasOverrides(true)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId) return item
        const firstSet = item.sets[0]
        const defaultMachine = item.availableMachines[0]
        return {
          ...item,
          sets: [
            ...item.sets,
            {
              ...createSet(defaultMachine),
              kg: firstSet?.kg ?? '',
              rir: firstSet?.rir || '1',
            },
          ],
        }
      }),
    )
  }

  const updateSet = (
    exerciseId: string,
    setId: string,
    key: 'reps' | 'kg' | 'rir',
    value: string,
  ) => {
    const normalizedValue = key === 'kg' ? toDecimalText(value) : toIntegerText(value)

    setHasOverrides(true)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId) return item

        const targetSetIndex = item.sets.findIndex((set) => set.id === setId)
        if (targetSetIndex < 0) return item

        const nextSets = item.sets.map((set) =>
          set.id === setId ? { ...set, [key]: normalizedValue } : set,
        )

        if (key === 'kg' && targetSetIndex === 0) {
          return {
            ...item,
            sets: nextSets.map((set, index) =>
              index === 0 || set.kg.length > 0 ? set : { ...set, kg: normalizedValue },
            ),
          }
        }

        return { ...item, sets: nextSets }
      }),
    )
  }

  const updateExerciseMachine = (
    exerciseId: string,
    machineId: string,
    machines: Array<{ id: string; label: string }>,
  ) => {
    const machine = machines.find((m) => m.id === machineId)
    setHasOverrides(true)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId) return item
        return {
          ...item,
          sets: item.sets.map((set) => ({
            ...set,
            machineId: machine?.id,
            machineLabel: machine?.label,
          })),
        }
      }),
    )
  }

  const clearSetDefaultOnFocus = (
    exerciseId: string,
    setId: string,
    key: 'reps' | 'kg' | 'rir',
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId) return item
        return {
          ...item,
          sets: item.sets.map((set) => {
            if (set.id !== setId) return set
            if (key === 'reps' && set.reps === '1') return { ...set, reps: '' }
            if (key === 'kg' && set.kg === '0') return { ...set, kg: '' }
            if (key === 'rir' && set.rir === '1') return { ...set, rir: '' }
            return set
          }),
        }
      }),
    )
  }

  const onExpandExercise = (exercise: WorkoutExercise) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === exercise.id ? { ...item, collapsed: !item.collapsed } : item,
      ),
    )

    const isExpanding = exercise.collapsed
    if (!isExpanding || !exercise.sourceExerciseId) return

    // Cargar history del ejercicio A (comportamiento original)
    if (exerciseHistories[exercise.sourceExerciseId] === undefined) {
      const { sourceExerciseId } = exercise
      setExerciseHistories((prev) => ({ ...prev, [sourceExerciseId]: 'loading' }))
      void getExerciseHistoryForWorkout(user!.uid, sourceExerciseId, context!.dateKey)
        .then((history) => {
          setExerciseHistories((prev) => ({ ...prev, [sourceExerciseId]: history }))
        })
        .catch(() => {
          setExerciseHistories((prev) => ({ ...prev, [sourceExerciseId]: null }))
        })
    }

    // Cargar history del ejercicio B en paralelo (nuevo)
    if (exercise.linkedExerciseId && exerciseHistories[exercise.linkedExerciseId] === undefined) {
      const { linkedExerciseId } = exercise
      setExerciseHistories((prev) => ({ ...prev, [linkedExerciseId]: 'loading' }))
      void getExerciseHistoryForWorkout(user!.uid, linkedExerciseId, context!.dateKey)
        .then((history) => {
          setExerciseHistories((prev) => ({ ...prev, [linkedExerciseId]: history }))
        })
        .catch(() => {
          setExerciseHistories((prev) => ({ ...prev, [linkedExerciseId]: null }))
        })
    }
  }

  const removeSet = (exerciseId: string, setId: string) => {
    setHasOverrides(true)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId || item.sets.length <= 1) return item
        return { ...item, sets: item.sets.filter((set) => set.id !== setId) }
      }),
    )
  }

  const switchAlternative = (exerciseId: string) => {
    setHasOverrides(true)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId || !item.linkedExerciseItemId) return item
        const next = item.selectedAlternative === 'A' ? 'B' : 'A'
        const defaultMachine =
          next === 'B' ? item.linkedAvailableMachines?.[0] : item.availableMachines[0]
        return {
          ...item,
          selectedAlternative: next,
          sets: [createSet(defaultMachine)],
        }
      }),
    )
  }

  const toggleDropset = (exerciseId: string, setId: string) => {
    setHasOverrides(true)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId) return item
        return {
          ...item,
          sets: item.sets.map((set) =>
            set.id === setId ? { ...set, isDropset: !set.isDropset } : set,
          ),
        }
      }),
    )
  }

  const onSave = async () => {
    if (!user || !context) return

    setIsSaving(true)
    setError(null)

    try {
      await saveWorkout(user.uid, {
        dateKey: context.dateKey,
        routineId: context.routineId,
        routineType: context.routineType,
        routineDayId: context.routineDayId,
        routineDayLabel: context.routineDayLabel,
        isFromActiveRoutine: context.isFromActiveRoutine,
        hasSessionOverrides: hasOverrides,
        exercises: deduplicatedItems.map((item) => {
          const useB = item.selectedAlternative === 'B' && item.linkedExerciseId !== undefined
          return {
            exerciseId: useB ? item.linkedExerciseId : item.sourceExerciseId,
            nameSnapshot: useB ? (item.linkedName ?? item.name) : item.name,
            sets: item.sets.map((set) => ({
              reps: parsePositiveNumber(set.reps, 1),
              weightKg: parseNonNegativeNumber(set.kg),
              rpe: parsePositiveNumber(set.rir, 1),
              machineId: set.machineId,
              machineLabel: set.machineLabel,
              isDropset: set.isDropset || undefined,
            })),
          }
        }),
      })

      setIsSaved(true)
      setSavedItemsSnapshot(JSON.stringify(items))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save workout.')
    } finally {
      setIsSaving(false)
    }
  }

  const onFinish = async () => {
    if (!user || !context) return
    setIsSaving(true)
    setError(null)
    try {
      await finishWorkout(user.uid, context.dateKey)
      navigate('/app/workout')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to finish workout.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <AppShell onBack={() => navigate('/app/workout')} title="Log workout" withNav={false}>
        <WorkoutSkeleton />
      </AppShell>
    )
  }

  // ── No context ───────────────────────────────────────────────────────────────

  if (!context) {
    return (
      <AppShell onBack={() => navigate('/app/workout')} title="Log workout" withNav={false}>
        <EmptyState
          action={<Button onClick={() => navigate('/app/workout')}>Back to dashboard</Button>}
          description="Workout context is unavailable."
          title="No workout"
        />
      </AppShell>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <AppShell
      onBack={() => navigate('/app/workout')}
      subtitle={context.routineName ?? 'No active routine'}
      title={context.routineDayLabel ? `Log: ${context.routineDayLabel}` : 'Log workout'}
      withNav={false}
    >
      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

      {/* ── Day template chips ─────────────────────────────────────────────── */}
      {defaultExerciseNames.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Day template
          </p>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {defaultExerciseNames.map((name) => (
              <span
                className="shrink-0 rounded-full border border-[var(--border-muted)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]"
                key={name}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Exercise picker ────────────────────────────────────────────────── */}
      {context.availableExercises.length > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)] px-4 py-2.5">
          <select
            aria-label="Select exercise to add"
            className="flex-1 appearance-none bg-transparent text-sm font-medium text-[var(--text-strong)] outline-none"
            onChange={(e) => setSelectedExercise(e.target.value)}
            value={selectedExercise}
          >
            {context.availableExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <Button onClick={() => void addAdHocExercise()} variant="secondary">
            Add exercise
          </Button>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {deduplicatedItems.length === 0 && (
        <EmptyState
          action={<Button onClick={() => void addAdHocExercise()}>Add exercise</Button>}
          description="No exercise loaded for this session."
          title="No exercises"
        />
      )}

      {/* ── Exercise list ──────────────────────────────────────────────────── */}
      {deduplicatedItems.map((exercise, index) => {
        const activeHistoryId =
          exercise.selectedAlternative === 'B' && exercise.linkedExerciseId
            ? exercise.linkedExerciseId
            : exercise.sourceExerciseId

        return (
          <ExerciseCard
            history={
              activeHistoryId
                ? exerciseHistories[activeHistoryId]
                : undefined
            }
            index={index}
            isDragging={draggingExerciseId === exercise.id}
            key={exercise.id}
            exercise={exercise}
            onExpand={() => onExpandExercise(exercise)}
            onRemove={() => removeExercise(exercise.id)}
            onAddSet={() => addSet(exercise.id)}
            onRemoveSet={(setId) => removeSet(exercise.id, setId)}
            onUpdateSet={(setId, key, value) => updateSet(exercise.id, setId, key, value)}
            onClearDefault={(setId, key) => clearSetDefaultOnFocus(exercise.id, setId, key)}
            onToggleDropset={(setId) => toggleDropset(exercise.id, setId)}
            onSelectMachine={(machineId) => updateExerciseMachine(exercise.id, machineId, exercise.availableMachines)}
            onDragOver={(e) => e.preventDefault()}
            onDragStart={() => setDraggingExerciseId(exercise.id)}
            onDrop={() => {
              if (!draggingExerciseId || draggingExerciseId === exercise.id) return
              const fromIndex = items.findIndex((item) => item.id === draggingExerciseId)
              const toIndex = items.findIndex((item) => item.id === exercise.id)
              if (fromIndex < 0 || toIndex < 0) return
              setHasOverrides(true)
              setItems((prev) => reorderItems(prev, fromIndex, toIndex))
              setDraggingExerciseId(null)
            }}
            onSwitchAlternative={() => switchAlternative(exercise.id)}
            linkedName={exercise.linkedName}
            selectedAlternative={exercise.selectedAlternative}
          />
        )
      })}

      {/* ── Save / Finish button ───────────────────────────────────────────── */}
      <div className="sticky bottom-20 z-10 pt-2">
        {isSaved && !hasChanges ? (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3.5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(124,58,237,0.4)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={() => void onFinish()}
            type="button"
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
            ) : null}
            {isSaving ? 'Finishing…' : 'Finish Workout'}
          </button>
        ) : (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3.5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(124,58,237,0.4)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={() => void onSave()}
            type="button"
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
            ) : null}
            {isSaving ? 'Saving…' : 'Save Workout'}
          </button>
        )}
      </div>
    </AppShell>
  )
}
