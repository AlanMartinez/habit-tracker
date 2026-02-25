export type DaysPerWeek = 3 | 4

export type RoutineExercisePlan = {
  id: string
  exerciseId: string
  nameSnapshot: string
  repsMode: 'fixed' | 'range'
  reps: string
  repsMin: string
  repsMax: string
  rirTarget: string
}

export type RoutineDayPlan = {
  id: string
  name: string
  exercises: RoutineExercisePlan[]
}

export type RoutinePlan = {
  id: string
  name: string
  daysPerWeek: DaysPerWeek
  days: RoutineDayPlan[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

const ROUTINE_STORAGE_KEY = 'habit-tracker.routines.v2'

const toId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const createSeedRoutine = (): RoutinePlan => {
  const now = Date.now()
  return {
    id: toId(),
    name: 'PPL Base',
    daysPerWeek: 3,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    days: [
      { id: 'day-1', name: 'Push', exercises: [] },
      { id: 'day-2', name: 'Pull', exercises: [] },
      { id: 'day-3', name: 'Legs', exercises: [] },
    ],
  }
}

const readRoutines = (): RoutinePlan[] => {
  if (typeof window === 'undefined') {
    return [createSeedRoutine()]
  }

  const raw = window.localStorage.getItem(ROUTINE_STORAGE_KEY)
  if (!raw) {
    const seed = [createSeedRoutine()]
    window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(raw) as RoutinePlan[]
    if (!Array.isArray(parsed)) {
      return [createSeedRoutine()]
    }
    return parsed
  } catch {
    return [createSeedRoutine()]
  }
}

const writeRoutines = (items: RoutinePlan[]): void => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(items))
}

const touchRoutine = (routine: RoutinePlan): RoutinePlan => ({
  ...routine,
  updatedAt: Date.now(),
})

const withUpdatedRoutine = (routineId: string, mutate: (routine: RoutinePlan) => RoutinePlan): void => {
  const current = readRoutines()
  const next = current.map((item) => (item.id === routineId ? touchRoutine(mutate(item)) : item))
  writeRoutines(next)
}

const reorderItems = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex) {
    return items
  }

  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

const defaultDayNames = (daysPerWeek: DaysPerWeek): string[] =>
  daysPerWeek === 3
    ? ['Day 1', 'Day 2', 'Day 3']
    : ['Day 1', 'Day 2', 'Day 3', 'Day 4']

export const listRoutinesLocal = (): RoutinePlan[] =>
  [...readRoutines()].sort((a, b) => b.updatedAt - a.updatedAt)

export const getRoutineByIdLocal = (routineId: string): RoutinePlan | null =>
  readRoutines().find((item) => item.id === routineId) ?? null

export const getActiveRoutineLocal = (): RoutinePlan | null =>
  readRoutines().find((item) => item.isActive) ?? null

export const createRoutineLocal = (name: string, daysPerWeek: DaysPerWeek): RoutinePlan => {
  const now = Date.now()
  const dayNames = defaultDayNames(daysPerWeek)
  const nextRoutine: RoutinePlan = {
    id: toId(),
    name,
    daysPerWeek,
    isActive: false,
    createdAt: now,
    updatedAt: now,
    days: dayNames.map((label, index) => ({
      id: `day-${index + 1}`,
      name: label,
      exercises: [],
    })),
  }

  const current = readRoutines()
  writeRoutines([...current, nextRoutine])
  return nextRoutine
}

export const deleteRoutineLocal = (routineId: string): void => {
  const current = readRoutines()
  const next = current.filter((item) => item.id !== routineId)

  if (next.length > 0 && !next.some((item) => item.isActive)) {
    next[0] = {
      ...next[0],
      isActive: true,
      updatedAt: Date.now(),
    }
  }

  writeRoutines(next)
}

export const setActiveRoutineLocal = (routineId: string): void => {
  const current = readRoutines()
  writeRoutines(
    current.map((item) =>
      touchRoutine({
        ...item,
        isActive: item.id === routineId,
      }),
    ),
  )
}

export const updateRoutineDayNameLocal = (
  routineId: string,
  dayId: string,
  nextName: string,
): void => {
  withUpdatedRoutine(routineId, (routine) => ({
    ...routine,
    days: routine.days.map((day) =>
      day.id === dayId
        ? {
            ...day,
            name: nextName,
          }
        : day,
    ),
  }))
}

export const addExerciseToRoutineDayLocal = (
  routineId: string,
  dayId: string,
  input: { exerciseId: string; nameSnapshot: string },
): void => {
  withUpdatedRoutine(routineId, (routine) => ({
    ...routine,
    days: routine.days.map((day) => {
      if (day.id !== dayId) {
        return day
      }

      return {
        ...day,
        exercises: [
          ...day.exercises,
          {
            id: toId(),
            exerciseId: input.exerciseId,
            nameSnapshot: input.nameSnapshot,
            repsMode: 'fixed',
            reps: '10',
            repsMin: '8',
            repsMax: '12',
            rirTarget: '',
          },
        ],
      }
    }),
  }))
}

export const updateRoutineExerciseLocal = (
  routineId: string,
  dayId: string,
  exerciseId: string,
  patch: Partial<Omit<RoutineExercisePlan, 'id' | 'exerciseId' | 'nameSnapshot'>>,
): void => {
  withUpdatedRoutine(routineId, (routine) => ({
    ...routine,
    days: routine.days.map((day) => {
      if (day.id !== dayId) {
        return day
      }

      return {
        ...day,
        exercises: day.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, ...patch } : exercise,
        ),
      }
    }),
  }))
}

export const removeRoutineExerciseLocal = (
  routineId: string,
  dayId: string,
  exerciseId: string,
): void => {
  withUpdatedRoutine(routineId, (routine) => ({
    ...routine,
    days: routine.days.map((day) =>
      day.id === dayId
        ? {
            ...day,
            exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId),
          }
        : day,
    ),
  }))
}

export const reorderRoutineExercisesLocal = (
  routineId: string,
  dayId: string,
  fromIndex: number,
  toIndex: number,
): void => {
  withUpdatedRoutine(routineId, (routine) => ({
    ...routine,
    days: routine.days.map((day) =>
      day.id === dayId
        ? {
            ...day,
            exercises: reorderItems(day.exercises, fromIndex, toIndex),
          }
        : day,
    ),
  }))
}

export const getMappedDayForDateLocal = (routine: RoutinePlan, date: Date): RoutineDayPlan => {
  const mondayBasedWeekday = (date.getDay() + 6) % 7
  const index = mondayBasedWeekday % routine.days.length
  return routine.days[index]
}
