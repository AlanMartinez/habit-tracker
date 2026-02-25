import { listExerciseLibrary, type ExerciseLibraryItem } from '../exercises/exercises.local'
import {
  getActiveRoutineLocal,
  getMappedDayForDateLocal,
  type RoutineDayPlan,
  type RoutinePlan,
} from '../routines/routines.local'

export type WorkoutExerciseDraft = {
  id: string
  sourceExerciseId?: string
  nameSnapshot: string
  targetLabel: string
}

export type WorkoutStartContext = {
  routine: RoutinePlan | null
  day: RoutineDayPlan | null
  exercises: WorkoutExerciseDraft[]
  availableExercises: ExerciseLibraryItem[]
}

const toId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const toTargetLabel = (input: {
  repsMode: 'fixed' | 'range'
  reps: string
  repsMin: string
  repsMax: string
  rirTarget: string
}): string => {
  const repsLabel = input.repsMode === 'fixed'
    ? input.reps || '-'
    : `${input.repsMin || '-'}-${input.repsMax || '-'}`
  const rir = input.rirTarget ? ` • RIR ${input.rirTarget}` : ''
  return `${repsLabel} reps${rir}`
}

export const getWorkoutStartContextLocal = (): WorkoutStartContext => {
  const routine = getActiveRoutineLocal()
  const availableExercises = listExerciseLibrary()

  if (!routine) {
    return {
      routine: null,
      day: null,
      exercises: [],
      availableExercises,
    }
  }

  const day = getMappedDayForDateLocal(routine, new Date())

  return {
    routine,
    day,
    availableExercises,
    exercises: day.exercises.map((item) => ({
      id: toId(),
      sourceExerciseId: item.exerciseId,
      nameSnapshot: item.nameSnapshot,
      targetLabel: toTargetLabel(item),
    })),
  }
}

export const createAdHocWorkoutExercise = (nameSnapshot: string, sourceExerciseId?: string) => ({
  id: toId(),
  sourceExerciseId,
  nameSnapshot,
  targetLabel: 'Custom',
})
