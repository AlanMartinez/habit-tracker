import { exerciseStore } from '../../firebase/firestore'
import type { Exercise, NewExerciseInput, WithId } from '../../shared/types/firestore'

export const listExercises = async (
  uid: string,
): Promise<Array<WithId<Exercise>>> => exerciseStore.list(uid)

export const createExercise = async (
  uid: string,
  input: NewExerciseInput,
): Promise<void> => {
  await exerciseStore.create(uid, input)
}

export const updateExercise = async (
  uid: string,
  exerciseId: string,
  input: NewExerciseInput,
): Promise<void> => {
  await exerciseStore.update(uid, exerciseId, input)
}

export const deleteExercise = async (
  uid: string,
  exerciseId: string,
): Promise<void> => {
  await exerciseStore.remove(uid, exerciseId)
}
