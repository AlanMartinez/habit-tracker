import { doc, getDoc } from 'firebase/firestore'
import { exerciseMachineStore, exerciseStore, routineStore, workoutStore } from '../../firebase/firestore'
import { db } from '../../firebase/firebase'
import type {
  DateIso,
  Exercise,
  RoutineType,
  SessionSet,
  UserProfile,
  WithId,
} from '../../shared/types/firestore'

export type WorkoutDraftSet = {
  id: string
  order: number
  reps: number
  weightKg: number
  rpe?: number
  machineId?: string
  machineLabel?: string
}

export type WorkoutDraftExercise = {
  id: string
  order: number
  exerciseId?: string
  nameSnapshot: string
  targetRepsMin?: number
  targetRepsMax?: number
  targetSets?: number
  sets: WorkoutDraftSet[]
  availableMachines: Array<{ id: string; label: string }>
}

export type WorkoutDraft = {
  dateKey: DateIso
  hasActiveSession: boolean
  routineId?: string
  routineType?: RoutineType | null
  routineName?: string
  routineDayId?: string
  routineDayLabel?: string
  routineDays: Array<{ id: string; label: string }>
  isFromActiveRoutine: boolean
  hasSessionOverrides: boolean
  exercises: WorkoutDraftExercise[]
  availableExercises: Array<WithId<Exercise>>
}

export type SaveWorkoutInput = {
  dateKey: DateIso
  routineId?: string
  routineType?: RoutineType | null
  routineDayId?: string
  routineDayLabel?: string
  isFromActiveRoutine: boolean
  hasSessionOverrides: boolean
  exercises: Array<{
    exerciseId?: string
    nameSnapshot: string
    sets: Array<{
      reps: number
      weightKg: number
      rpe?: number
      machineId?: string
      machineLabel?: string
    }>
  }>
}

export type RoutineDayTemplateDraft = {
  routineDayId: string
  routineDayLabel?: string
  exercises: WorkoutDraftExercise[]
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const getDateKey = (date: Date): DateIso => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` as DateIso
}

const toDefaultSet = (order: number): WorkoutDraftSet => ({
  id: `set-${order + 1}`,
  order,
  reps: 1,
  weightKg: 0,
  rpe: 1,
})

const getMappedDayId = (
  dayIds: string[],
  fallbackDayIds: string[],
  date: Date,
): string | undefined => {
  const orderedDayIds = dayIds.length > 0 ? dayIds : fallbackDayIds
  if (orderedDayIds.length === 0) {
    return undefined
  }

  const mondayBasedWeekday = (date.getDay() + 6) % 7
  return orderedDayIds[mondayBasedWeekday % orderedDayIds.length]
}

const toDraftSet = (item: WithId<SessionSet>): WorkoutDraftSet => ({
  id: item.id,
  order: item.order,
  reps: item.reps,
  weightKg: item.weightKg,
  rpe: item.rpe,
  machineId: item.machineId,
  machineLabel: item.machineLabel,
})

export const getTodayWorkoutDraft = async (
  uid: string,
  options?: { routineDayId?: string },
): Promise<WorkoutDraft> => {
  const dateKey = getDateKey(new Date())
  const availableExercises = await exerciseStore.list(uid)
  const userSnapshot = await getDoc(doc(db, 'users', uid))
  const userProfile = userSnapshot.exists()
    ? (userSnapshot.data() as UserProfile)
    : null

  if (!userProfile?.activeRoutineId) {
    return {
      dateKey,
      hasActiveSession: false,
      routineDays: [],
      isFromActiveRoutine: false,
      hasSessionOverrides: false,
      exercises: [],
      availableExercises,
    }
  }

  const routine = await routineStore.get(uid, userProfile.activeRoutineId)
  if (!routine) {
    return {
      dateKey,
      hasActiveSession: false,
      routineDays: [],
      isFromActiveRoutine: false,
      hasSessionOverrides: false,
      exercises: [],
      availableExercises,
    }
  }

  const days = await routineStore.listDays(uid, routine.id)
  const dayById = new Map(days.map((day) => [day.id, day]))
  const normalizedDayOrder = routine.dayOrder.filter((dayId) => dayById.has(dayId))
  const fallbackDayOrder = days.map((day) => day.id)
  const mappedDayId = getMappedDayId(normalizedDayOrder, fallbackDayOrder, new Date())
  const selectedDayId = options?.routineDayId && dayById.has(options.routineDayId)
    ? options.routineDayId
    : mappedDayId
  const selectedDay = selectedDayId ? dayById.get(selectedDayId) : undefined

  const existingSession = await workoutStore.get(uid, dateKey)
  // If user explicitly selects a routine day from Start Workout,
  // always rebuild the draft from that day template.
  const shouldUseExistingSession = Boolean(existingSession) && !options?.routineDayId

  if (existingSession && shouldUseExistingSession) {
    const sessionExercises = await workoutStore.listExercises(uid, existingSession.id)
    const exercises = await Promise.all(
      sessionExercises.map(async (item) => {
        const sets = await workoutStore.listSets(uid, existingSession.id, item.id)
        const availableMachines = item.exerciseId
          ? (await exerciseMachineStore.list(uid, item.exerciseId)).map((m) => ({ id: m.id, label: m.label }))
          : []
        return {
          id: item.id,
          order: item.order,
          exerciseId: item.exerciseId,
          nameSnapshot: item.nameSnapshot,
          sets: sets.map(toDraftSet),
          availableMachines,
        } satisfies WorkoutDraftExercise
      }),
    )

    return {
      dateKey,
      hasActiveSession: true,
      routineId: existingSession.routineId,
      routineType: existingSession.routineType ?? null,
      routineName: routine.name,
      routineDayId: existingSession.routineDayId,
      routineDayLabel: existingSession.routineDayLabel,
      routineDays: days.map((day) => ({ id: day.id, label: day.label })),
      isFromActiveRoutine: existingSession.isFromActiveRoutine,
      hasSessionOverrides: existingSession.hasSessionOverrides,
      exercises,
      availableExercises,
    }
  }

  const routineDayExercises = selectedDayId
    ? await routineStore.listDayExercises(uid, routine.id, selectedDayId)
    : []
  const draftExercises = await Promise.all(
    routineDayExercises.map(async (item) => {
      const targetSets = item.targetSets ?? 1
      const availableMachines = item.exerciseId
        ? (await exerciseMachineStore.list(uid, item.exerciseId)).map((m) => ({ id: m.id, label: m.label }))
        : []
      return {
        id: item.id,
        order: item.order,
        exerciseId: item.exerciseId,
        nameSnapshot: item.nameSnapshot,
        targetRepsMin: item.targetRepsMin,
        targetRepsMax: item.targetRepsMax,
        targetSets,
        sets: Array.from({ length: targetSets }, (_, index) => toDefaultSet(index)),
        availableMachines,
      }
    }),
  )

  return {
    dateKey,
    hasActiveSession: false,
    routineId: routine.id,
    routineType: routine.type,
    routineName: routine.name,
    routineDayId: selectedDayId,
    routineDayLabel: selectedDay?.label,
    routineDays: days.map((day) => ({ id: day.id, label: day.label })),
    isFromActiveRoutine: true,
    hasSessionOverrides: false,
    exercises: draftExercises,
    availableExercises,
  }
}

export const getRoutineDayTemplateDraft = async (
  uid: string,
  routineId: string,
  routineDayId: string,
): Promise<RoutineDayTemplateDraft> => {
  const days = await routineStore.listDays(uid, routineId)
  const selectedDay = days.find((day) => day.id === routineDayId)

  if (!selectedDay) {
    return {
      routineDayId,
      exercises: [],
    }
  }

  const dayExercises = await routineStore.listDayExercises(uid, routineId, routineDayId)
  const exercises = await Promise.all(
    dayExercises.map(async (item) => {
      const targetSets = item.targetSets ?? 1
      const availableMachines = item.exerciseId
        ? (await exerciseMachineStore.list(uid, item.exerciseId)).map((m) => ({ id: m.id, label: m.label }))
        : []
      return {
        id: item.id,
        order: item.order,
        exerciseId: item.exerciseId,
        nameSnapshot: item.nameSnapshot,
        targetRepsMin: item.targetRepsMin,
        targetRepsMax: item.targetRepsMax,
        targetSets,
        sets: Array.from({ length: targetSets }, (_, index) => toDefaultSet(index)),
        availableMachines,
      }
    }),
  )
  return {
    routineDayId,
    routineDayLabel: selectedDay.label,
    exercises,
  }
}

export const saveWorkout = async (uid: string, payload: SaveWorkoutInput): Promise<void> => {
  if (!DATE_KEY_PATTERN.test(payload.dateKey)) {
    throw new Error('Date key must be YYYY-MM-DD.')
  }

  for (const exercise of payload.exercises) {
    if (exercise.nameSnapshot.trim().length === 0) {
      throw new Error('Exercise name is required.')
    }

    for (const set of exercise.sets) {
      if (set.reps < 0) {
        throw new Error('Reps must be at least 0.')
      }
      if (set.weightKg < 0) {
        throw new Error('Weight must be at least 0.')
      }
    }
  }

  const sessionId = await workoutStore.upsertByDate(uid, payload.dateKey, {
    routineId: payload.routineId,
    routineType: payload.routineType,
    routineDayId: payload.routineDayId,
    routineDayLabel: payload.routineDayLabel,
    isFromActiveRoutine: payload.isFromActiveRoutine,
    hasSessionOverrides: payload.hasSessionOverrides,
  })

  const existingExercises = await workoutStore.listExercises(uid, sessionId)
  for (const exercise of existingExercises) {
    const existingSets = await workoutStore.listSets(uid, sessionId, exercise.id)
    for (const set of existingSets) {
      await workoutStore.removeSet(uid, sessionId, exercise.id, set.id)
    }
    await workoutStore.removeExercise(uid, sessionId, exercise.id)
  }

  for (let exerciseIndex = 0; exerciseIndex < payload.exercises.length; exerciseIndex += 1) {
    const exercise = payload.exercises[exerciseIndex]
    const sessionExerciseId = `exercise-${exerciseIndex + 1}`

    await workoutStore.upsertExercise(uid, sessionId, sessionExerciseId, {
      exerciseId: exercise.exerciseId,
      nameSnapshot: exercise.nameSnapshot,
      order: exerciseIndex,
    })

    for (let setIndex = 0; setIndex < exercise.sets.length; setIndex += 1) {
      const set = exercise.sets[setIndex]
      await workoutStore.upsertSet(uid, sessionId, sessionExerciseId, `set-${setIndex + 1}`, {
        order: setIndex,
        reps: set.reps,
        weightKg: set.weightKg,
        rpe: set.rpe,
        machineId: set.machineId,
        machineLabel: set.machineLabel,
      })
    }
  }

  await workoutStore.finish(uid, sessionId)
}
