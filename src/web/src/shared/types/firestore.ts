import type { Timestamp } from 'firebase/firestore';

export type RoutineType = 'AB' | 'PPL' | 'CUSTOM';
export type ModuleType = 'GYM';
export type DateIso = `${number}-${number}-${number}`;

export type WithId<T> = T & { id: string };

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  selectedModule: ModuleType;
  activeRoutineId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Exercise {
  ownerUid: string;
  name: string;
  primaryMuscle?: string;
  equipment?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewExerciseInput {
  name: string;
  primaryMuscle?: string;
  equipment?: string;
  notes?: string;
}

export interface Routine {
  ownerUid: string;
  name: string;
  type: RoutineType;
  daysPerWeek: number;
  isActive: boolean;
  dayOrder: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewRoutineInput {
  name: string;
  type: RoutineType;
  daysPerWeek: number;
  isActive?: boolean;
  dayOrder?: string[];
}

export interface RoutineDay {
  ownerUid: string;
  label: string;
  order: number;
  exerciseOrder: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewRoutineDayInput {
  label: string;
  order: number;
  exerciseOrder?: string[];
}

export interface RoutineDayExercise {
  ownerUid: string;
  exerciseId: string;
  nameSnapshot: string;
  targetRepsMin: number;
  targetRepsMax: number;
  targetSets: number;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewRoutineDayExerciseInput {
  exerciseId: string;
  nameSnapshot: string;
  targetRepsMin: number;
  targetRepsMax: number;
  targetSets: number;
  order: number;
}

export interface WorkoutSession {
  ownerUid: string;
  date: DateIso;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  routineId?: string;
  routineType?: RoutineType | null;
  routineDayId?: string;
  routineDayLabel?: string;
  isFromActiveRoutine: boolean;
  hasSessionOverrides: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewWorkoutSessionInput {
  date: DateIso;
  routineId?: string;
  routineType?: RoutineType | null;
  routineDayId?: string;
  routineDayLabel?: string;
  isFromActiveRoutine: boolean;
  hasSessionOverrides?: boolean;
}

export interface SessionExercise {
  ownerUid: string;
  exerciseId?: string;
  nameSnapshot: string;
  order: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewSessionExerciseInput {
  exerciseId?: string;
  nameSnapshot: string;
  order: number;
  notes?: string;
}

export interface ExerciseMachine {
  ownerUid: string;
  label: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewExerciseMachineInput {
  label: string;
  notes?: string;
}

export interface SessionSet {
  ownerUid: string;
  order: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  machineId?: string;
  machineLabel?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewSessionSetInput {
  order: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  machineId?: string;
  machineLabel?: string;
}
