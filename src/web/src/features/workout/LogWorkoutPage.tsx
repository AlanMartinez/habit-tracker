import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import {
  AppShell,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
} from '../../shared/components'
import {
  getExerciseHistoryForWorkout,
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
}

type WorkoutExercise = {
  id: string
  sourceExerciseId?: string
  name: string
  collapsed: boolean
  sets: WorkoutSet[]
}

const toId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const createSet = (): WorkoutSet => ({
  id: toId(),
  reps: '',
  kg: '',
  rir: '',
})

const reorderItems = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex) {
    return items
  }

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

  if (decimals.length === 0) {
    return integerPart
  }

  return `${integerPart}.${decimals.join('')}`
}

const mapDraftToExercise = (item: WorkoutDraft['exercises'][number]): WorkoutExercise => ({
  id: item.id,
  sourceExerciseId: item.exerciseId,
  name: item.nameSnapshot,
  collapsed: true,
  sets: item.sets.length > 0
    ? item.sets.map((set) => ({
        id: set.id,
        reps: set.reps > 1 ? String(set.reps) : '',
        kg: set.weightKg > 0 ? String(set.weightKg) : '',
        rir: (set.rpe ?? 1) > 1 ? String(set.rpe ?? 1) : '',
      }))
    : [createSet()],
})

const parseNonNegativeNumber = (value: string): number => {
  const trimmed = value.trim()
  if (!trimmed) {
    return 0
  }
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return parsed
}

const parsePositiveNumber = (value: string, fallback: number): number => {
  const parsed = parseNonNegativeNumber(value)
  return parsed < 1 ? fallback : parsed
}

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
  const [hasOverrides, setHasOverrides] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [defaultExerciseNames, setDefaultExerciseNames] = useState<string[]>([])
  const [exerciseHistories, setExerciseHistories] = useState<Record<string, ExerciseHistory | 'loading' | null>>({})

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

  const addAdHocExercise = () => {
    if (!selectedExerciseItem) {
      return
    }

    setHasOverrides(true)
    setItems((prev) => [
      ...prev,
      {
        id: toId(),
        sourceExerciseId: selectedExerciseItem.id,
        name: selectedExerciseItem.name,
        collapsed: false,
        sets: [createSet()],
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
        if (item.id !== exerciseId) {
          return item
        }

        const firstSet = item.sets[0]
        return {
          ...item,
          sets: [
            ...item.sets,
            {
              ...createSet(),
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
        if (item.id !== exerciseId) {
          return item
        }

        const targetSetIndex = item.sets.findIndex((set) => set.id === setId)
        if (targetSetIndex < 0) {
          return item
        }

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

        return {
          ...item,
          sets: nextSets,
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
        if (item.id !== exerciseId) {
          return item
        }

        return {
          ...item,
          sets: item.sets.map((set) => {
            if (set.id !== setId) {
              return set
            }

            if (key === 'reps' && set.reps === '1') {
              return { ...set, reps: '' }
            }

            if (key === 'kg' && set.kg === '0') {
              return { ...set, kg: '' }
            }

            if (key === 'rir' && set.rir === '1') {
              return { ...set, rir: '' }
            }

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
    if (exerciseHistories[exercise.sourceExerciseId] !== undefined) return

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

  const removeSet = (exerciseId: string, setId: string) => {
    setHasOverrides(true)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId || item.sets.length <= 1) {
          return item
        }

        return {
          ...item,
          sets: item.sets.filter((set) => set.id !== setId),
        }
      }),
    )
  }

  const onSave = async () => {
    if (!user || !context) {
      return
    }

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
        exercises: items.map((item) => ({
          exerciseId: item.sourceExerciseId,
          nameSnapshot: item.name,
          sets: item.sets.map((set) => ({
            reps: parsePositiveNumber(set.reps, 1),
            weightKg: parseNonNegativeNumber(set.kg),
            rpe: parsePositiveNumber(set.rir, 1),
          })),
        })),
      })

      navigate('/app/workout')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save workout.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell onBack={() => navigate('/app/workout')} title="Log workout">
        <p className="text-sm text-[var(--text-muted)]">Loading workout...</p>
      </AppShell>
    )
  }

  if (!context) {
    return (
      <AppShell onBack={() => navigate('/app/workout')} title="Log workout">
        <EmptyState
          action={<Button onClick={() => navigate('/app/workout')}>Back to dashboard</Button>}
          description="Workout context is unavailable."
          title="No workout"
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      onBack={() => navigate('/app/workout')}
      subtitle={context.routineName ?? 'No active routine'}
      title={context.routineDayLabel ? `Log: ${context.routineDayLabel}` : 'Log workout'}
    >
      {error && <p className="text-sm text-red-600">{error}</p>}

      <details className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--text-strong)]">
          Default exercises for selected day
        </summary>
        {defaultExerciseNames.length === 0 && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">No default exercises configured.</p>
        )}
        {defaultExerciseNames.length > 0 && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">{defaultExerciseNames.join(' • ')}</p>
        )}
      </details>

      {context.availableExercises.length > 0 && (
        <Card className="space-y-3">
          <Select
            id="add-exercise"
            label="Add ad-hoc exercise"
            onChange={(event) => setSelectedExercise(event.target.value)}
            options={context.availableExercises.map((exercise) => ({
              label: exercise.name,
              value: exercise.id,
            }))}
            value={selectedExercise}
          />
          <Button onClick={addAdHocExercise} variant="secondary">
            Add exercise
          </Button>
        </Card>
      )}

      {items.length === 0 && (
        <EmptyState
          action={<Button onClick={addAdHocExercise}>Add exercise</Button>}
          description="No exercise loaded for this session."
          title="No exercises"
        />
      )}

      {items.map((exercise, index) => (
        <Card
          className="space-y-3"
          draggable
          key={exercise.id}
          onDragOver={(event) => event.preventDefault()}
          onDragStart={() => setDraggingExerciseId(exercise.id)}
          onDrop={() => {
            if (!draggingExerciseId || draggingExerciseId === exercise.id) {
              return
            }

            const fromIndex = items.findIndex((item) => item.id === draggingExerciseId)
            const toIndex = items.findIndex((item) => item.id === exercise.id)

            if (fromIndex < 0 || toIndex < 0) {
              return
            }

            setHasOverrides(true)
            setItems((prev) => reorderItems(prev, fromIndex, toIndex))
            setDraggingExerciseId(null)
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-strong)]">
                {index + 1}. {exercise.name}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onExpandExercise(exercise)}
                size="sm"
                variant="ghost"
              >
                {exercise.collapsed ? 'Expand' : 'Collapse'}
              </Button>
              <Button onClick={() => removeExercise(exercise.id)} size="sm" variant="secondary">
                Remove
              </Button>
            </div>
          </div>

          {!exercise.collapsed && (
            <>
              {exercise.sourceExerciseId && (() => {
                const history = exerciseHistories[exercise.sourceExerciseId]
                if (history === 'loading') {
                  return <p className="text-xs text-[var(--text-muted)] animate-pulse">Loading history...</p>
                }
                if (!history) return null
                return (
                  <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-muted)] space-y-0.5">
                    <p>
                      <span className="font-semibold text-[var(--text-strong)]">Last session:</span>{' '}
                      {new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })
                        .format(new Date(history.lastSessionDate + 'T12:00:00'))}{' '}
                      — {history.lastSetWeightKg} kg (last set)
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--text-strong)]">Max recorded:</span>{' '}
                      {history.maxWeightKg} kg
                    </p>
                  </div>
                )
              })()}

              <div className="grid grid-cols-[0.7fr_1fr_1fr_1fr_auto] gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <span>Set</span>
                <span>Reps</span>
                <span>Kg</span>
                <span>RIR</span>
                <span>Del</span>
              </div>

              {exercise.sets.map((set, setIndex) => (
                <div className="grid grid-cols-[0.7fr_1fr_1fr_1fr_auto] gap-2" key={set.id}>
                  <div className="flex min-h-11 items-center rounded-lg border border-[var(--border-muted)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)]">
                    {setIndex + 1}
                  </div>
                  <Input
                    id={`reps-${set.id}`}
                    inputMode="numeric"
                    label="Reps"
                    onChange={(event) =>
                      updateSet(exercise.id, set.id, 'reps', event.target.value)
                    }
                    onFocus={() => clearSetDefaultOnFocus(exercise.id, set.id, 'reps')}
                    pattern="[0-9]*"
                    placeholder="1"
                    type="number"
                    value={set.reps}
                  />
                  <Input
                    id={`kg-${set.id}`}
                    inputMode="decimal"
                    label="Kg"
                    onChange={(event) => updateSet(exercise.id, set.id, 'kg', event.target.value)}
                    onFocus={() => clearSetDefaultOnFocus(exercise.id, set.id, 'kg')}
                    placeholder="0"
                    step="0.5"
                    type="number"
                    value={set.kg}
                  />
                  <Input
                    id={`rir-${set.id}`}
                    inputMode="numeric"
                    label="RIR"
                    onChange={(event) => updateSet(exercise.id, set.id, 'rir', event.target.value)}
                    onFocus={() => clearSetDefaultOnFocus(exercise.id, set.id, 'rir')}
                    pattern="[0-9]*"
                    placeholder="1"
                    type="number"
                    value={set.rir}
                  />
                  <Button
                    onClick={() => removeSet(exercise.id, set.id)}
                    size="sm"
                    variant="ghost"
                  >
                    ✕
                  </Button>
                </div>
              ))}

              <Button onClick={() => addSet(exercise.id)} size="sm" variant="secondary">
                Add set
              </Button>
            </>
          )}
        </Card>
      ))}

      <div className="sticky bottom-20 z-10 rounded-2xl bg-transparent pt-2">
        <Button className="w-full" loading={isSaving} onClick={() => void onSave()}>
          {isSaving ? 'Saving...' : 'Save Workout'}
        </Button>
      </div>
    </AppShell>
  )
}
