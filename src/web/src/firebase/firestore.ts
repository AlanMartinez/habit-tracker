import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type DocumentReference,
  type QueryConstraint,
} from 'firebase/firestore';

import type {
  DateIso,
  Exercise,
  NewExerciseInput,
  NewRoutineDayExerciseInput,
  NewRoutineDayInput,
  NewRoutineInput,
  NewSessionExerciseInput,
  NewSessionSetInput,
  NewWorkoutSessionInput,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  SessionExercise,
  SessionSet,
  WithId,
  WorkoutSession,
} from '../shared/types/firestore';
import { db } from './firebase';

type FirestoreTimestampValue = ReturnType<typeof serverTimestamp>;

const toOptionalString = (value?: string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toRequiredString = (value: string, fieldName: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
  return trimmed;
};

const stampForCreate = (): {
  createdAt: FirestoreTimestampValue;
  updatedAt: FirestoreTimestampValue;
} => ({
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const stampForUpdate = (): { updatedAt: FirestoreTimestampValue } => ({
  updatedAt: serverTimestamp(),
});

const withId = <T extends DocumentData>(id: string, data: DocumentData): WithId<T> => ({
  id,
  ...(data as T),
});

const stripUndefined = (payload: Record<string, unknown>): Record<string, unknown> => {
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      next[key] = value;
    }
  }

  return next;
};

const upsertOwnedDoc = async (
  reference: DocumentReference,
  uid: string,
  payload: Record<string, unknown>,
): Promise<void> => {
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    await updateDoc(reference, {
      ...stripUndefined(payload),
      ...stampForUpdate(),
    });
    return;
  }

  await setDoc(reference, {
    ownerUid: uid,
    ...stripUndefined(payload),
    ...stampForCreate(),
  });
};

const exercisesCol = (uid: string) => collection(db, 'users', uid, 'exercises');
const routinesCol = (uid: string) => collection(db, 'users', uid, 'routines');
const routineDaysCol = (uid: string, routineId: string) =>
  collection(db, 'users', uid, 'routines', routineId, 'days');
const routineDayExercisesCol = (uid: string, routineId: string, dayId: string) =>
  collection(db, 'users', uid, 'routines', routineId, 'days', dayId, 'exercises');
const workoutSessionsCol = (uid: string) => collection(db, 'users', uid, 'workoutSessions');
const sessionExercisesCol = (uid: string, sessionId: string) =>
  collection(db, 'users', uid, 'workoutSessions', sessionId, 'exercises');
const sessionSetsCol = (uid: string, sessionId: string, sessionExerciseId: string) =>
  collection(db, 'users', uid, 'workoutSessions', sessionId, 'exercises', sessionExerciseId, 'sets');

export const exerciseStore = {
  async list(uid: string): Promise<Array<WithId<Exercise>>> {
    const snapshot = await getDocs(query(exercisesCol(uid), orderBy('name', 'asc')));
    return snapshot.docs.map((item) => withId<Exercise>(item.id, item.data()));
  },

  async get(uid: string, exerciseId: string): Promise<WithId<Exercise> | null> {
    const reference = doc(db, 'users', uid, 'exercises', exerciseId);
    const snapshot = await getDoc(reference);
    return snapshot.exists() ? withId<Exercise>(snapshot.id, snapshot.data()) : null;
  },

  async create(uid: string, payload: NewExerciseInput): Promise<string> {
    const reference = doc(exercisesCol(uid));
    await setDoc(reference, {
      ownerUid: uid,
      name: toRequiredString(payload.name, 'Exercise name'),
      primaryMuscle: toOptionalString(payload.primaryMuscle),
      equipment: toOptionalString(payload.equipment),
      notes: toOptionalString(payload.notes),
      ...stampForCreate(),
    });
    return reference.id;
  },

  async update(uid: string, exerciseId: string, payload: Partial<NewExerciseInput>): Promise<void> {
    const updates: Record<string, unknown> = {
      ...stampForUpdate(),
    };

    if (payload.name !== undefined) {
      updates.name = toRequiredString(payload.name, 'Exercise name');
    }
    if (payload.primaryMuscle !== undefined) {
      updates.primaryMuscle = toOptionalString(payload.primaryMuscle);
    }
    if (payload.equipment !== undefined) {
      updates.equipment = toOptionalString(payload.equipment);
    }
    if (payload.notes !== undefined) {
      updates.notes = toOptionalString(payload.notes);
    }

    await updateDoc(doc(db, 'users', uid, 'exercises', exerciseId), updates);
  },

  async remove(uid: string, exerciseId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'exercises', exerciseId));
  },
};

export const routineStore = {
  async list(uid: string): Promise<Array<WithId<Routine>>> {
    const snapshot = await getDocs(query(routinesCol(uid), orderBy('updatedAt', 'desc')));
    return snapshot.docs.map((item) => withId<Routine>(item.id, item.data()));
  },

  async get(uid: string, routineId: string): Promise<WithId<Routine> | null> {
    const snapshot = await getDoc(doc(db, 'users', uid, 'routines', routineId));
    return snapshot.exists() ? withId<Routine>(snapshot.id, snapshot.data()) : null;
  },

  async create(uid: string, payload: NewRoutineInput): Promise<string> {
    const reference = doc(routinesCol(uid));
    await setDoc(reference, {
      ownerUid: uid,
      name: toRequiredString(payload.name, 'Routine name'),
      type: payload.type,
      daysPerWeek: payload.daysPerWeek,
      isActive: payload.isActive ?? false,
      dayOrder: payload.dayOrder ?? [],
      ...stampForCreate(),
    });
    return reference.id;
  },

  async update(uid: string, routineId: string, payload: Partial<NewRoutineInput>): Promise<void> {
    const updates: Record<string, unknown> = {
      ...stampForUpdate(),
    };

    if (payload.name !== undefined) {
      updates.name = toRequiredString(payload.name, 'Routine name');
    }
    if (payload.type !== undefined) {
      updates.type = payload.type;
    }
    if (payload.daysPerWeek !== undefined) {
      updates.daysPerWeek = payload.daysPerWeek;
    }
    if (payload.isActive !== undefined) {
      updates.isActive = payload.isActive;
    }
    if (payload.dayOrder !== undefined) {
      updates.dayOrder = payload.dayOrder;
    }

    await updateDoc(doc(db, 'users', uid, 'routines', routineId), updates);
  },

  async remove(uid: string, routineId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'routines', routineId));
  },

  async listDays(uid: string, routineId: string): Promise<Array<WithId<RoutineDay>>> {
    const snapshot = await getDocs(query(routineDaysCol(uid, routineId), orderBy('order', 'asc')));
    return snapshot.docs.map((item) => withId<RoutineDay>(item.id, item.data()));
  },

  async upsertDay(
    uid: string,
    routineId: string,
    dayId: string,
    payload: NewRoutineDayInput,
  ): Promise<void> {
    await upsertOwnedDoc(
      doc(db, 'users', uid, 'routines', routineId, 'days', dayId),
      uid,
      {
        label: toRequiredString(payload.label, 'Routine day label'),
        order: payload.order,
        exerciseOrder: payload.exerciseOrder ?? [],
      },
    );
  },

  async removeDay(uid: string, routineId: string, dayId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'routines', routineId, 'days', dayId));
  },

  async listDayExercises(
    uid: string,
    routineId: string,
    dayId: string,
  ): Promise<Array<WithId<RoutineDayExercise>>> {
    const snapshot = await getDocs(
      query(routineDayExercisesCol(uid, routineId, dayId), orderBy('order', 'asc')),
    );
    return snapshot.docs.map((item) => withId<RoutineDayExercise>(item.id, item.data()));
  },

  async upsertDayExercise(
    uid: string,
    routineId: string,
    dayId: string,
    exerciseItemId: string,
    payload: NewRoutineDayExerciseInput,
  ): Promise<void> {
    await upsertOwnedDoc(
      doc(db, 'users', uid, 'routines', routineId, 'days', dayId, 'exercises', exerciseItemId),
      uid,
      {
        exerciseId: toRequiredString(payload.exerciseId, 'Exercise id'),
        nameSnapshot: toRequiredString(payload.nameSnapshot, 'Exercise name snapshot'),
        targetRepsMin: payload.targetRepsMin,
        targetRepsMax: payload.targetRepsMax,
        targetSets: payload.targetSets,
        order: payload.order,
      },
    );
  },

  async removeDayExercise(
    uid: string,
    routineId: string,
    dayId: string,
    exerciseItemId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(db, 'users', uid, 'routines', routineId, 'days', dayId, 'exercises', exerciseItemId),
    );
  },
};

export const workoutStore = {
  async list(
    uid: string,
    options?: { fromDate?: string; toDate?: string; take?: number },
  ): Promise<Array<WithId<WorkoutSession>>> {
    const constraints: QueryConstraint[] = [orderBy('date', 'desc')];

    if (options?.fromDate !== undefined) {
      constraints.push(where('date', '>=', options.fromDate));
    }
    if (options?.toDate !== undefined) {
      constraints.push(where('date', '<=', options.toDate));
    }
    if (options?.take !== undefined) {
      constraints.push(limit(options.take));
    }

    const snapshot = await getDocs(query(workoutSessionsCol(uid), ...constraints));
    return snapshot.docs.map((item) => withId<WorkoutSession>(item.id, item.data()));
  },

  async get(uid: string, sessionId: string): Promise<WithId<WorkoutSession> | null> {
    const snapshot = await getDoc(doc(db, 'users', uid, 'workoutSessions', sessionId));
    return snapshot.exists() ? withId<WorkoutSession>(snapshot.id, snapshot.data()) : null;
  },

  async create(uid: string, payload: NewWorkoutSessionInput): Promise<string> {
    const reference = doc(workoutSessionsCol(uid));
    await setDoc(reference, {
      ownerUid: uid,
      date: payload.date,
      startedAt: serverTimestamp(),
      routineId: payload.routineId,
      routineType: payload.routineType ?? null,
      routineDayId: payload.routineDayId,
      routineDayLabel: payload.routineDayLabel,
      isFromActiveRoutine: payload.isFromActiveRoutine,
      hasSessionOverrides: payload.hasSessionOverrides ?? false,
      ...stampForCreate(),
    });
    return reference.id;
  },

  async upsertByDate(
    uid: string,
    date: DateIso,
    payload: Omit<NewWorkoutSessionInput, 'date'>,
  ): Promise<string> {
    const reference = doc(db, 'users', uid, 'workoutSessions', date);
    const snapshot = await getDoc(reference);

    if (snapshot.exists()) {
      await updateDoc(reference, {
        date,
        routineId: payload.routineId,
        routineType: payload.routineType ?? null,
        routineDayId: payload.routineDayId,
        routineDayLabel: payload.routineDayLabel,
        isFromActiveRoutine: payload.isFromActiveRoutine,
        hasSessionOverrides: payload.hasSessionOverrides ?? false,
        ...stampForUpdate(),
      });
      return date;
    }

    await setDoc(reference, {
      ownerUid: uid,
      date,
      startedAt: serverTimestamp(),
      routineId: payload.routineId,
      routineType: payload.routineType ?? null,
      routineDayId: payload.routineDayId,
      routineDayLabel: payload.routineDayLabel,
      isFromActiveRoutine: payload.isFromActiveRoutine,
      hasSessionOverrides: payload.hasSessionOverrides ?? false,
      ...stampForCreate(),
    });

    return date;
  },

  async finish(uid: string, sessionId: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid, 'workoutSessions', sessionId), {
      endedAt: serverTimestamp(),
      ...stampForUpdate(),
    });
  },

  async update(
    uid: string,
    sessionId: string,
    payload: Partial<Pick<NewWorkoutSessionInput, 'hasSessionOverrides' | 'routineDayLabel'>>,
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      ...stampForUpdate(),
    };

    if (payload.hasSessionOverrides !== undefined) {
      updates.hasSessionOverrides = payload.hasSessionOverrides;
    }
    if (payload.routineDayLabel !== undefined) {
      updates.routineDayLabel = toOptionalString(payload.routineDayLabel);
    }

    await updateDoc(doc(db, 'users', uid, 'workoutSessions', sessionId), updates);
  },

  async remove(uid: string, sessionId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'workoutSessions', sessionId));
  },

  async listExercises(uid: string, sessionId: string): Promise<Array<WithId<SessionExercise>>> {
    const snapshot = await getDocs(query(sessionExercisesCol(uid, sessionId), orderBy('order', 'asc')));
    return snapshot.docs.map((item) => withId<SessionExercise>(item.id, item.data()));
  },

  async upsertExercise(
    uid: string,
    sessionId: string,
    sessionExerciseId: string,
    payload: NewSessionExerciseInput,
  ): Promise<void> {
    await upsertOwnedDoc(
      doc(db, 'users', uid, 'workoutSessions', sessionId, 'exercises', sessionExerciseId),
      uid,
      {
        exerciseId: toOptionalString(payload.exerciseId),
        nameSnapshot: toRequiredString(payload.nameSnapshot, 'Session exercise name'),
        order: payload.order,
        notes: toOptionalString(payload.notes),
      },
    );
  },

  async removeExercise(uid: string, sessionId: string, sessionExerciseId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'workoutSessions', sessionId, 'exercises', sessionExerciseId));
  },

  async listSets(
    uid: string,
    sessionId: string,
    sessionExerciseId: string,
  ): Promise<Array<WithId<SessionSet>>> {
    const snapshot = await getDocs(
      query(sessionSetsCol(uid, sessionId, sessionExerciseId), orderBy('order', 'asc')),
    );
    return snapshot.docs.map((item) => withId<SessionSet>(item.id, item.data()));
  },

  async upsertSet(
    uid: string,
    sessionId: string,
    sessionExerciseId: string,
    setId: string,
    payload: NewSessionSetInput,
  ): Promise<void> {
    await upsertOwnedDoc(
      doc(db, 'users', uid, 'workoutSessions', sessionId, 'exercises', sessionExerciseId, 'sets', setId),
      uid,
      {
        order: payload.order,
        reps: payload.reps,
        weightKg: payload.weightKg,
        rpe: payload.rpe,
      },
    );
  },

  async removeSet(
    uid: string,
    sessionId: string,
    sessionExerciseId: string,
    setId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(db, 'users', uid, 'workoutSessions', sessionId, 'exercises', sessionExerciseId, 'sets', setId),
    );
  },
};
