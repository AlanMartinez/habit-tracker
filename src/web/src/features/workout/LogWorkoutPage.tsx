import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import type { Exercise } from '../../shared/types/firestore'
import { getTodayWorkoutDraft, saveWorkout, type WorkoutDraft } from './workout.data'

type SetForm = {
  id: string
  reps: string
  weightKg: string
  rpe: string
}

type ExerciseForm = {
  id: string
  exerciseId?: string
  nameSnapshot: string
  sets: SetForm[]
}

const toSetForm = (item: { id: string; reps: number; weightKg: number; rpe?: number }): SetForm => ({
  id: item.id,
  reps: String(item.reps),
  weightKg: String(item.weightKg),
  rpe: item.rpe === undefined ? '' : String(item.rpe),
})

const toExerciseForm = (draft: WorkoutDraft): ExerciseForm[] =>
  draft.exercises.map((item) => ({
    id: item.id,
    exerciseId: item.exerciseId,
    nameSnapshot: item.nameSnapshot,
    sets: item.sets.map(toSetForm),
  }))

const getExerciseKey = (item: ExerciseForm): string => `${item.exerciseId ?? ''}|${item.nameSnapshot}`

const createLocalId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const toNonNegativeNumber = (value: string): number | null => {
  const normalized = value.trim()
  if (normalized.length === 0) {
    return null
  }

  const parsed = Number(normalized)
  if (Number.isNaN(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

export const LogWorkoutPage = () => {
  const { user } = useAuth()
  const [draft, setDraft] = useState<WorkoutDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [exerciseForms, setExerciseForms] = useState<ExerciseForm[]>([])
  const [baselineExerciseKeys, setBaselineExerciseKeys] = useState<string[]>([])

  const loadDraft = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const nextDraft = await getTodayWorkoutDraft(user.uid)
      setDraft(nextDraft)

      const nextForms = toExerciseForm(nextDraft)
      setExerciseForms(nextForms)
      setBaselineExerciseKeys(nextForms.map(getExerciseKey))
    } catch {
      setErrorMessage('Unable to load today\'s workout.')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadDraft()
  }, [loadDraft])

  const availableExerciseOptions = useMemo(
    () => draft?.availableExercises ?? [],
    [draft],
  )

  const hasSessionOverrides = useMemo(() => {
    const currentKeys = exerciseForms.map(getExerciseKey)

    if (currentKeys.length !== baselineExerciseKeys.length) {
      return true
    }

    const hasChangedOrderOrItems = currentKeys.some((item, index) => item !== baselineExerciseKeys[index])
    return (draft?.hasSessionOverrides ?? false) || hasChangedOrderOrItems
  }, [baselineExerciseKeys, draft?.hasSessionOverrides, exerciseForms])

  const addExerciseForSession = (exercise: Exercise & { id: string }) => {
    setExerciseForms((prev) => [
      ...prev,
      {
        id: createLocalId(),
        exerciseId: exercise.id,
        nameSnapshot: exercise.name,
        sets: [{ id: createLocalId(), reps: '0', weightKg: '0', rpe: '' }],
      },
    ])
  }

  const removeExerciseForSession = (exerciseId: string) => {
    setExerciseForms((prev) => prev.filter((item) => item.id !== exerciseId))
  }

  const addSet = (exerciseId: string) => {
    setExerciseForms((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: [
                ...exercise.sets,
                { id: createLocalId(), reps: '0', weightKg: '0', rpe: '' },
              ],
            }
          : exercise,
      ),
    )
  }

  const removeSet = (exerciseId: string, setId: string) => {
    setExerciseForms((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((item) => item.id !== setId),
        }
      }),
    )
  }

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: keyof Omit<SetForm, 'id'>,
    value: string,
  ) => {
    setExerciseForms((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise
        }

        return {
          ...exercise,
          sets: exercise.sets.map((setItem) =>
            setItem.id === setId ? { ...setItem, [field]: value } : setItem,
          ),
        }
      }),
    )
  }

  const onAddExercise = () => {
    if (!selectedExerciseId || !draft) {
      return
    }

    const selected = draft.availableExercises.find((item) => item.id === selectedExerciseId)
    if (!selected) {
      return
    }

    addExerciseForSession(selected)
    setSelectedExerciseId('')
  }

  const onSave = async () => {
    if (!user || !draft) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    const payloadExercises: Array<{
      exerciseId?: string
      nameSnapshot: string
      sets: Array<{ reps: number; weightKg: number; rpe?: number }>
    }> = []

    for (const exercise of exerciseForms) {
      const normalizedExerciseName = exercise.nameSnapshot.trim()
      if (normalizedExerciseName.length === 0) {
        setErrorMessage('Exercise name is required.')
        return
      }

      const parsedSets: Array<{ reps: number; weightKg: number; rpe?: number }> = []

      for (const setItem of exercise.sets) {
        const reps = toNonNegativeNumber(setItem.reps)
        const weightKg = toNonNegativeNumber(setItem.weightKg)

        if (reps === null) {
          setErrorMessage('Each set must have reps greater than or equal to 0.')
          return
        }

        if (weightKg === null) {
          setErrorMessage('Each set must have weight greater than or equal to 0.')
          return
        }

        const normalizedRpe = setItem.rpe.trim()
        const rpeValue = normalizedRpe.length === 0 ? undefined : toNonNegativeNumber(normalizedRpe)
        if (normalizedRpe.length > 0 && rpeValue === null) {
          setErrorMessage('RPE must be blank or greater than or equal to 0.')
          return
        }
        const safeRpe = normalizedRpe.length === 0 ? undefined : (rpeValue ?? undefined)

        parsedSets.push({
          reps,
          weightKg,
          rpe: safeRpe,
        })
      }

      payloadExercises.push({
        exerciseId: exercise.exerciseId,
        nameSnapshot: normalizedExerciseName,
        sets: parsedSets,
      })
    }

    setIsSaving(true)
    try {
      await saveWorkout(user.uid, {
        dateKey: draft.dateKey,
        routineId: draft.routineId,
        routineType: draft.routineType,
        routineDayId: draft.routineDayId,
        routineDayLabel: draft.routineDayLabel,
        isFromActiveRoutine: draft.isFromActiveRoutine,
        hasSessionOverrides,
        exercises: payloadExercises,
      })
      setSuccessMessage(`Workout saved for ${draft.dateKey}.`)
      await loadDraft()
    } catch {
      setErrorMessage('Unable to save workout. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl p-4">
        <p className="text-sm text-slate-600">You need to sign in to log workouts.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-4 p-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Log Workout</h1>
        <p className="text-sm text-slate-600">
          Add or remove exercises for today only. Your routine template is not changed.
        </p>
        <Link className="text-sm text-blue-700 underline" to="/module-select">
          Back
        </Link>
      </header>

      {isLoading && <p className="text-sm text-slate-600">Loading today&apos;s workout...</p>}

      {!isLoading && draft && (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Today</p>
            <p className="mt-1 text-sm text-slate-800">{draft.dateKey}</p>
            <p className="mt-2 text-sm text-slate-700">
              Routine: {draft.routineName ?? 'No active routine'}
            </p>
            <p className="text-sm text-slate-700">
              Day: {draft.routineDayLabel ?? 'No mapped day'}
            </p>
          </section>

          {draft.routineId && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Add Exercise For Today</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  className="min-w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  onChange={(event) => setSelectedExerciseId(event.target.value)}
                  value={selectedExerciseId}
                >
                  <option value="">Select exercise</option>
                  {availableExerciseOptions.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                  disabled={selectedExerciseId.length === 0}
                  onClick={onAddExercise}
                  type="button"
                >
                  Add
                </button>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Exercises</h2>

            {exerciseForms.length === 0 && (
              <p className="mt-3 text-sm text-slate-600">
                No exercises for today. Add one from your exercise library.
              </p>
            )}

            {exerciseForms.length > 0 && (
              <ul className="mt-3 space-y-4">
                {exerciseForms.map((exercise, exerciseIndex) => (
                  <li className="rounded-md border border-slate-200 p-3" key={exercise.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {exerciseIndex + 1}. {exercise.nameSnapshot}
                      </p>
                      <button
                        className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700"
                        onClick={() => removeExerciseForSession(exercise.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {exercise.sets.map((setItem, setIndex) => (
                        <div className="grid grid-cols-4 gap-2" key={setItem.id}>
                          <input
                            className="rounded-md border border-slate-300 px-2 py-2 text-sm"
                            min={0}
                            onChange={(event) =>
                              updateSet(exercise.id, setItem.id, 'reps', event.target.value)
                            }
                            placeholder={`Set ${setIndex + 1} reps`}
                            type="number"
                            value={setItem.reps}
                          />
                          <input
                            className="rounded-md border border-slate-300 px-2 py-2 text-sm"
                            min={0}
                            onChange={(event) =>
                              updateSet(exercise.id, setItem.id, 'weightKg', event.target.value)
                            }
                            placeholder="Weight (kg)"
                            type="number"
                            value={setItem.weightKg}
                          />
                          <input
                            className="rounded-md border border-slate-300 px-2 py-2 text-sm"
                            min={0}
                            onChange={(event) =>
                              updateSet(exercise.id, setItem.id, 'rpe', event.target.value)
                            }
                            placeholder="RPE (optional)"
                            type="number"
                            value={setItem.rpe}
                          />
                          <button
                            className="rounded border border-slate-300 px-2 py-2 text-xs font-medium text-slate-700"
                            onClick={() => removeSet(exercise.id, setItem.id)}
                            type="button"
                          >
                            Remove set
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      className="mt-3 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      onClick={() => addSet(exercise.id)}
                      type="button"
                    >
                      Add set
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}

          <button
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSaving || !draft.routineId}
            onClick={onSave}
            type="button"
          >
            {isSaving ? 'Saving...' : 'Save workout'}
          </button>
        </>
      )}
    </main>
  )
}
