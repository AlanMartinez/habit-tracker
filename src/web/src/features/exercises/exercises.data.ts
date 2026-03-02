import { exerciseMachineStore, exerciseStore } from '../../firebase/firestore'
import type {
  Exercise,
  ExerciseMachine,
  NewExerciseInput,
  NewExerciseMachineInput,
  WithId,
} from '../../shared/types/firestore'

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

export const listMachines = async (
  uid: string,
  exerciseId: string,
): Promise<Array<WithId<ExerciseMachine>>> => exerciseMachineStore.list(uid, exerciseId)

export const createMachine = async (
  uid: string,
  exerciseId: string,
  input: NewExerciseMachineInput,
): Promise<string> => exerciseMachineStore.create(uid, exerciseId, input)

export const updateMachine = async (
  uid: string,
  exerciseId: string,
  machineId: string,
  input: Partial<NewExerciseMachineInput>,
): Promise<void> => exerciseMachineStore.update(uid, exerciseId, machineId, input)

export const deleteMachine = async (
  uid: string,
  exerciseId: string,
  machineId: string,
): Promise<void> => exerciseMachineStore.remove(uid, exerciseId, machineId)
