import { workoutStore } from '../../firebase/firestore'
import type {
  SessionExercise,
  SessionSet,
  WithId,
  WorkoutSession,
} from '../../shared/types/firestore'

export type SessionExerciseWithSets = WithId<SessionExercise> & {
  sets: Array<WithId<SessionSet>>
}

export type WorkoutSessionDetail = WithId<WorkoutSession> & {
  exercises: SessionExerciseWithSets[]
}

type MonthRange = {
  fromDate: string
  toDate: string
}

const toIsoDate = (value: Date): string => {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getMonthRange = (month: Date): MonthRange => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  return {
    fromDate: toIsoDate(start),
    toDate: toIsoDate(end),
  }
}

export const listWorkoutsForMonth = async (
  uid: string,
  month: Date,
): Promise<Array<WithId<WorkoutSession>>> => {
  const { fromDate, toDate } = getMonthRange(month)
  return workoutStore.list(uid, { fromDate, toDate })
}

export const getWorkoutSessionDetail = async (
  uid: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> => {
  const session = await workoutStore.get(uid, sessionId)
  if (!session) {
    throw new Error('Workout session not found.')
  }

  const exercises = await workoutStore.listExercises(uid, session.id)
  const exercisesWithSets = await Promise.all(
    exercises.map(async (exercise) => {
      const sets = await workoutStore.listSets(uid, session.id, exercise.id)
      return {
        ...exercise,
        sets,
      }
    }),
  )

  return {
    ...session,
    exercises: exercisesWithSets,
  }
}
