import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import type { Exercise, Routine, WithId } from '../../shared/types/firestore'
import { listExercises } from '../exercises/exercises.data'
import {
  getDefaultDayOrder,
  getRoutineBuilderData,
  getTemplateDays,
  listRoutines,
  replaceDayExercises,
  setActiveRoutine,
  updateRoutineSchedule,
  type RoutineDayWithExercises,
} from './routines.data'

type ScheduleSlot = {
  dayId: string
}

const clampTrainingDays = (value: number): number => Math.max(1, Math.min(7, value))

export const RoutineBuilderPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const params = useParams<{ routineId: string }>()
  const routineId = params.routineId

  const [routine, setRoutine] = useState<WithId<Routine> | null>(null)
  const [days, setDays] = useState<RoutineDayWithExercises[]>([])
  const [library, setLibrary] = useState<Array<WithId<Exercise>>>([])
  const [activeDayId, setActiveDayId] = useState<string>('')
  const [newExerciseId, setNewExerciseId] = useState<string>('')
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [isSettingActive, setIsSettingActive] = useState(false)
  const [draggedExerciseId, setDraggedExerciseId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadBuilderData = useCallback(async () => {
    if (!user || !routineId) {
      return
    }

    try {
      const [builderData, exercises] = await Promise.all([
        getRoutineBuilderData(user.uid, routineId),
        listExercises(user.uid),
      ])

      const nextDays = builderData.days
      const nextRoutine = builderData.routine
      const validDayIds = new Set(nextDays.map((day) => day.id))
      const fallbackSchedule = getDefaultDayOrder(nextRoutine.type).filter((dayId) =>
        validDayIds.has(dayId),
      )
      const currentSchedule = nextRoutine.dayOrder.filter((dayId) => validDayIds.has(dayId))
      const scheduleSource = currentSchedule.length > 0 ? currentSchedule : fallbackSchedule

      setRoutine(nextRoutine)
      setDays(nextDays)
      setLibrary(exercises)
      setActiveDayId((prev) => prev || nextDays[0]?.id || '')
      setSchedule(scheduleSource.map((dayId) => ({ dayId })))
      setNewExerciseId((prev) => prev || exercises[0]?.id || '')
      setErrorMessage(null)
    } catch {
      setErrorMessage('Failed to load routine builder.')
    } finally {
      setIsLoading(false)
    }
  }, [routineId, user])

  useEffect(() => {
    if (!user || !routineId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    void loadBuilderData()
  }, [loadBuilderData, routineId, user])

  const activeDay = useMemo(
    () => days.find((day) => day.id === activeDayId) ?? days[0] ?? null,
    [activeDayId, days],
  )

  const dayOptions = useMemo(() => {
    if (!routine) {
      return []
    }
    return getTemplateDays(routine.type)
  }, [routine])

  const persistDayExercises = async (
    dayId: string,
    nextExercises: Array<{ id: string; exerciseId: string; nameSnapshot: string }>,
  ) => {
    if (!user || !routine) {
      return
    }

    await replaceDayExercises(
      user.uid,
      routine.id,
      dayId,
      nextExercises.map((item) => ({
        itemId: item.id,
        exerciseId: item.exerciseId,
        nameSnapshot: item.nameSnapshot,
      })),
    )
  }

  const onAddExerciseToDay = async () => {
    if (!activeDay || !newExerciseId || !library.length) {
      return
    }

    const exercise = library.find((item) => item.id === newExerciseId)
    if (!exercise) {
      return
    }

    const nextExercises = [
      ...activeDay.exercises.map((item) => ({
        id: item.id,
        exerciseId: item.exerciseId,
        nameSnapshot: item.nameSnapshot,
      })),
      { id: '', exerciseId: exercise.id, nameSnapshot: exercise.name },
    ]

    setErrorMessage(null)
    try {
      await persistDayExercises(activeDay.id, nextExercises)
      await loadBuilderData()
    } catch {
      setErrorMessage('Unable to add exercise to day.')
    }
  }

  const onRemoveExerciseFromDay = async (exerciseItemId: string) => {
    if (!activeDay) {
      return
    }

    const nextExercises = activeDay.exercises
      .filter((item) => item.id !== exerciseItemId)
      .map((item) => ({
        id: item.id,
        exerciseId: item.exerciseId,
        nameSnapshot: item.nameSnapshot,
      }))
    setErrorMessage(null)
    try {
      await persistDayExercises(activeDay.id, nextExercises)
      await loadBuilderData()
    } catch {
      setErrorMessage('Unable to remove exercise.')
    }
  }

  const onDropExercise = async (targetExerciseId: string) => {
    if (!activeDay || !draggedExerciseId || draggedExerciseId === targetExerciseId) {
      return
    }

    const fromIndex = activeDay.exercises.findIndex((item) => item.id === draggedExerciseId)
    const toIndex = activeDay.exercises.findIndex((item) => item.id === targetExerciseId)
    if (fromIndex < 0 || toIndex < 0) {
      return
    }

    const reordered = activeDay.exercises.map((item) => ({
      id: item.id,
      exerciseId: item.exerciseId,
      nameSnapshot: item.nameSnapshot,
    }))
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    setErrorMessage(null)
    try {
      await persistDayExercises(activeDay.id, reordered)
      await loadBuilderData()
    } catch {
      setErrorMessage('Unable to reorder exercises.')
    } finally {
      setDraggedExerciseId(null)
    }
  }

  const onSaveSchedule = async () => {
    if (!user || !routine) {
      return
    }

    setErrorMessage(null)
    setIsSavingSchedule(true)
    try {
      await updateRoutineSchedule(
        user.uid,
        routine.id,
        schedule.map((slot) => slot.dayId),
      )
      await loadBuilderData()
    } catch {
      setErrorMessage('Unable to save schedule mapping.')
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const onSetActive = async () => {
    if (!user || !routine) {
      return
    }

    setErrorMessage(null)
    setIsSettingActive(true)
    try {
      const routines = await listRoutines(user.uid)
      await setActiveRoutine(user.uid, routines, routine.id)
      await loadBuilderData()
    } catch {
      setErrorMessage('Unable to set active routine.')
    } finally {
      setIsSettingActive(false)
    }
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl p-4">
        <p className="text-sm text-slate-600">You need to sign in to edit routines.</p>
      </main>
    )
  }

  if (!routineId) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl p-4">
        <p className="text-sm text-slate-600">Select a routine to open the builder.</p>
        <Link className="text-sm text-blue-700 underline" to="/routines">
          Back to routines
        </Link>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl p-4">
        <p className="text-sm text-slate-600">Loading routine builder...</p>
      </main>
    )
  }

  if (!routine) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl space-y-3 p-4">
        <p className="text-sm text-slate-600">Routine not found.</p>
        <button
          className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700"
          onClick={() => navigate('/routines')}
          type="button"
        >
          Back to routines
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-4 p-4">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Routine Builder
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">{routine.name}</h1>
        <p className="text-sm text-slate-600">{routine.type} template</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="text-blue-700 underline" to="/routines">
            Back to routines
          </Link>
          {!routine.isActive && (
            <button
              className="rounded border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 disabled:opacity-60"
              disabled={isSettingActive}
              onClick={onSetActive}
              type="button"
            >
              {isSettingActive ? 'Setting...' : 'Set as active routine'}
            </button>
          )}
          {routine.isActive && (
            <p className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              Active routine
            </p>
          )}
        </div>
      </header>

      {errorMessage && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{errorMessage}</p>}

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Schedule Mapping</h2>
        <p className="text-xs text-slate-600">
          Map your weekly training slots to routine days. Reduce slots for short weeks.
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="trainingDaysCount">
            Training days/week
          </label>
          <input
            className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
            id="trainingDaysCount"
            max={7}
            min={1}
            onChange={(event) => {
              const nextCount = clampTrainingDays(Number(event.target.value || 1))
              setSchedule((previous) => {
                if (nextCount === previous.length) {
                  return previous
                }

                if (nextCount < previous.length) {
                  return previous.slice(0, nextCount)
                }

                const fallbackId = dayOptions[0]?.id ?? ''
                const next = [...previous]
                for (let index = previous.length; index < nextCount; index += 1) {
                  next.push({
                    dayId: previous[index - 1]?.dayId ?? fallbackId,
                  })
                }
                return next
              })
            }}
            type="number"
            value={schedule.length}
          />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {schedule.map((slot, index) => (
            <label className="flex items-center gap-3 text-sm text-slate-700" key={`${slot.dayId}-${index}`}>
              <span className="w-14 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Day {index + 1}
              </span>
              <select
                className="flex-1 rounded-md border border-slate-300 px-2 py-1"
                onChange={(event) =>
                  setSchedule((previous) =>
                    previous.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, dayId: event.target.value } : item,
                    ),
                  )
                }
                value={slot.dayId}
              >
                {dayOptions.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <button
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          disabled={isSavingSchedule}
          onClick={onSaveSchedule}
          type="button"
        >
          {isSavingSchedule ? 'Saving mapping...' : 'Save schedule mapping'}
        </button>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Day Builder</h2>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeDay?.id === day.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-300 text-slate-700'
              }`}
              key={day.id}
              onClick={() => setActiveDayId(day.id)}
              type="button"
            >
              {day.label}
            </button>
          ))}
        </div>

        {activeDay && (
          <div className="space-y-3">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-sm font-medium text-slate-800">
                Add exercise to {activeDay.label}
              </p>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
                  onChange={(event) => setNewExerciseId(event.target.value)}
                  value={newExerciseId}
                >
                  {library.length === 0 && <option value="">No exercises available</option>}
                  {library.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={!newExerciseId || library.length === 0}
                  onClick={onAddExerciseToDay}
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>

            {activeDay.exercises.length === 0 && (
              <p className="text-sm text-slate-600">
                No exercises in this day yet. Add from My Exercises above.
              </p>
            )}

            {activeDay.exercises.length > 0 && (
              <ul className="space-y-2">
                {activeDay.exercises.map((item, index) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
                    draggable
                    key={item.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => setDraggedExerciseId(item.id)}
                    onDrop={() => void onDropExercise(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.nameSnapshot}</p>
                        <p className="text-xs text-slate-500">Drag to reorder</p>
                      </div>
                    </div>
                    <button
                      className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700"
                      onClick={() => void onRemoveExerciseFromDay(item.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
