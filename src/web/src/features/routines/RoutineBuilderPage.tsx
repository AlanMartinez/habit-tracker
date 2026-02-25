import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import type { Exercise, WithId } from '../../shared/types/firestore'
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
} from '../../shared/components'
import { listExercises } from '../exercises/exercises.data'
import {
  getRoutineBuilderData,
  renameRoutineDay,
  replaceDayExercises,
  type RoutineDayWithExercises,
} from './routines.data'

const toItemId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const toPositiveInt = (value: string, fallback: number): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.floor(parsed)
}

export const RoutineBuilderPage = () => {
  const navigate = useNavigate()
  const { routineId } = useParams<{ routineId: string }>()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routineName, setRoutineName] = useState('')
  const [days, setDays] = useState<RoutineDayWithExercises[]>([])
  const [activeDayId, setActiveDayId] = useState('')
  const [dayNameDrafts, setDayNameDrafts] = useState<Record<string, string>>({})
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [availableExercises, setAvailableExercises] = useState<Array<WithId<Exercise>>>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [pendingExercise, setPendingExercise] = useState<WithId<Exercise> | null>(null)
  const [targetRepsMin, setTargetRepsMin] = useState('8')
  const [targetRepsMax, setTargetRepsMax] = useState('12')
  const [targetSets, setTargetSets] = useState('3')

  const refreshRoutineData = async () => {
    if (!user || !routineId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [builderData, library] = await Promise.all([
        getRoutineBuilderData(user.uid, routineId),
        listExercises(user.uid),
      ])

      setRoutineName(builderData.routine.name)
      setDays(builderData.days)
      setActiveDayId((prev) =>
        builderData.days.some((day) => day.id === prev) ? prev : (builderData.days[0]?.id ?? ''),
      )
      setDayNameDrafts(
        Object.fromEntries(builderData.days.map((day) => [day.id, day.label])),
      )
      setAvailableExercises(library)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load routine builder.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshRoutineData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, routineId])

  const selectedDay = useMemo(() => {
    if (days.length === 0) {
      return null
    }
    return days.find((day) => day.id === activeDayId) ?? days[0]
  }, [activeDayId, days])

  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase()
    if (!query) {
      return availableExercises
    }
    return availableExercises.filter((item) => item.name.toLowerCase().includes(query))
  }, [availableExercises, exerciseSearch])

  const onRenameDay = async (dayId: string) => {
    if (!user || !routineId) {
      return
    }

    const nextLabel = dayNameDrafts[dayId]?.trim()
    const currentDay = days.find((day) => day.id === dayId)

    if (!currentDay || !nextLabel || nextLabel === currentDay.label) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await renameRoutineDay(user.uid, routineId, dayId, nextLabel)
      await refreshRoutineData()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to rename routine day.')
    } finally {
      setIsSaving(false)
    }
  }

  const persistDayExercises = async (
    dayId: string,
    exercises: Array<{
      itemId?: string
      exerciseId: string
      nameSnapshot: string
      targetRepsMin: number
      targetRepsMax: number
      targetSets: number
    }>,
  ) => {
    if (!user || !routineId) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await replaceDayExercises(user.uid, routineId, dayId, exercises)
      await refreshRoutineData()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to update day exercises.')
    } finally {
      setIsSaving(false)
    }
  }

  const openAddExercise = (exercise: WithId<Exercise>) => {
    setPendingExercise(exercise)
    setTargetRepsMin('8')
    setTargetRepsMax('12')
    setTargetSets('3')
    setAddModalOpen(true)
  }

  const confirmAddExercise = async () => {
    if (!pendingExercise || !selectedDay) {
      return
    }

    const repsMin = toPositiveInt(targetRepsMin, 8)
    const repsMax = toPositiveInt(targetRepsMax, 12)
    const sets = toPositiveInt(targetSets, 3)
    const normalizedMin = Math.min(repsMin, repsMax)
    const normalizedMax = Math.max(repsMin, repsMax)

    await persistDayExercises(selectedDay.id, [
      ...selectedDay.exercises.map((item) => ({
        itemId: item.id,
        exerciseId: item.exerciseId,
        nameSnapshot: item.nameSnapshot,
        targetRepsMin: item.targetRepsMin ?? 8,
        targetRepsMax: item.targetRepsMax ?? 12,
        targetSets: item.targetSets ?? 3,
      })),
      {
        itemId: toItemId(),
        exerciseId: pendingExercise.id,
        nameSnapshot: pendingExercise.name,
        targetRepsMin: normalizedMin,
        targetRepsMax: normalizedMax,
        targetSets: sets,
      },
    ])

    setAddModalOpen(false)
    setPendingExercise(null)
  }

  if (!routineId || !user) {
    return (
      <AppShell onBack={() => navigate('/app/routines')} title="Routine builder">
        <EmptyState
          action={<Button onClick={() => navigate('/app/routines')}>Go back</Button>}
          description="You must be authenticated to edit a routine."
          title="Unavailable"
        />
      </AppShell>
    )
  }

  if (isLoading) {
    return (
      <AppShell onBack={() => navigate('/app/routines')} title="Routine builder">
        <p className="text-sm text-[var(--text-muted)]">Loading routine data...</p>
      </AppShell>
    )
  }

  if (days.length === 0) {
    return (
      <AppShell onBack={() => navigate('/app/routines')} title="Routine builder">
        <EmptyState
          action={<Button onClick={() => navigate('/app/routines')}>Go back</Button>}
          description="The requested routine could not be found."
          title="Routine not found"
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      onBack={() => navigate('/app/routines')}
      subtitle={isSaving ? 'Saving changes...' : `${days.length} days`}
      title={routineName}
    >
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
          Day Names
        </h2>
        <div className="grid gap-2 md:grid-cols-2">
          {days.map((day, index) => (
            <Input
              id={`day-name-${day.id}`}
              key={day.id}
              label={`Day ${index + 1}`}
              onBlur={() => void onRenameDay(day.id)}
              onChange={(event) =>
                setDayNameDrafts((prev) => ({ ...prev, [day.id]: event.target.value }))
              }
              placeholder={`Day ${index + 1}`}
              value={dayNameDrafts[day.id] ?? ''}
            />
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
          Weekly Days
        </h2>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <Button
              key={day.id}
              onClick={() => setActiveDayId(day.id)}
              size="sm"
              variant={selectedDay?.id === day.id ? 'primary' : 'secondary'}
            >
              {day.label || 'Unnamed day'}
            </Button>
          ))}
        </div>
      </Card>

      {selectedDay && (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--text-strong)]">
                  Exercise Library
                </h3>
                <Badge tone="info">{filteredExercises.length} available</Badge>
              </div>

              <Input
                id="routine-exercise-search"
                label="Search exercise"
                onChange={(event) => setExerciseSearch(event.target.value)}
                placeholder="Filter by name"
                value={exerciseSearch}
              />

              {filteredExercises.length === 0 && (
                <EmptyState
                  description="Create exercises in the Exercises module first, then add them here."
                  title="No exercises available"
                />
              )}

              {filteredExercises.length > 0 && (
                <div className="space-y-2">
                  {filteredExercises.map((exercise) => (
                    <div
                      className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-3"
                      key={exercise.id}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-strong)]">{exercise.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {exercise.primaryMuscle || 'No muscle'} - {exercise.equipment || 'No equipment'}
                        </p>
                      </div>
                      <Button onClick={() => openAddExercise(exercise)} size="sm">
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--text-strong)]">
                  Selected For {selectedDay.label || 'Selected Day'}
                </h3>
                <Badge tone="active">{selectedDay.exercises.length} selected</Badge>
              </div>

              {selectedDay.exercises.length === 0 && (
                <EmptyState
                  description="Add at least one exercise for this day."
                  title="No exercises yet"
                />
              )}

              {selectedDay.exercises.length > 0 && (
                <div className="space-y-3">
                  {selectedDay.exercises.map((exercise, index) => (
                    <div
                      className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                      draggable
                      key={exercise.id}
                      onDragOver={(event) => event.preventDefault()}
                      onDragStart={() => setDraggingExerciseId(exercise.id)}
                      onDrop={() => {
                        if (!draggingExerciseId || draggingExerciseId === exercise.id) {
                          return
                        }

                        const fromIndex = selectedDay.exercises.findIndex(
                          (item) => item.id === draggingExerciseId,
                        )
                        const toIndex = selectedDay.exercises.findIndex(
                          (item) => item.id === exercise.id,
                        )

                        if (fromIndex < 0 || toIndex < 0) {
                          return
                        }

                        const reordered = [...selectedDay.exercises]
                        const [moved] = reordered.splice(fromIndex, 1)
                        reordered.splice(toIndex, 0, moved)

                        void persistDayExercises(
                          selectedDay.id,
                          reordered.map((item) => ({
                            itemId: item.id,
                            exerciseId: item.exerciseId,
                            nameSnapshot: item.nameSnapshot,
                            targetRepsMin: item.targetRepsMin ?? 8,
                            targetRepsMax: item.targetRepsMax ?? 12,
                            targetSets: item.targetSets ?? 3,
                          })),
                        )
                        setDraggingExerciseId(null)
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-strong)]">
                            {index + 1}. {exercise.nameSnapshot}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            Target: {exercise.targetRepsMin ?? 8}-{exercise.targetRepsMax ?? 12} reps x {exercise.targetSets ?? 3} sets
                          </p>
                        </div>
                        <Button
                          onClick={() =>
                            void persistDayExercises(
                              selectedDay.id,
                              selectedDay.exercises
                                .filter((item) => item.id !== exercise.id)
                                .map((item) => ({
                                  itemId: item.id,
                                  exerciseId: item.exerciseId,
                                  nameSnapshot: item.nameSnapshot,
                                  targetRepsMin: item.targetRepsMin ?? 8,
                                  targetRepsMax: item.targetRepsMax ?? 12,
                                  targetSets: item.targetSets ?? 3,
                                })),
                            )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <Modal
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setAddModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={() => void confirmAddExercise()}>Add exercise</Button>
          </div>
        }
        onClose={() => setAddModalOpen(false)}
        open={addModalOpen}
        title={pendingExercise ? `Add ${pendingExercise.name}` : 'Add exercise'}
      >
        <Input
          id="target-reps-min"
          label="Min reps"
          onChange={(event) => setTargetRepsMin(event.target.value.replace(/[^0-9]/g, ''))}
          value={targetRepsMin}
        />
        <Input
          id="target-reps-max"
          label="Max reps"
          onChange={(event) => setTargetRepsMax(event.target.value.replace(/[^0-9]/g, ''))}
          value={targetRepsMax}
        />
        <Input
          id="target-sets"
          label="Sets"
          onChange={(event) => setTargetSets(event.target.value.replace(/[^0-9]/g, ''))}
          value={targetSets}
        />
      </Modal>
    </AppShell>
  )
}
