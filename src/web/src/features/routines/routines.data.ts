import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { routineStore } from '../../firebase/firestore'
import { db } from '../../firebase/firebase'
import type {
  NewRoutineInput,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  WithId,
} from '../../shared/types/firestore'

export type DaysPerWeek = 3 | 4 | 5

export type RoutineDayWithExercises = WithId<RoutineDay> & {
  exercises: Array<WithId<RoutineDayExercise>>
}

const toItemId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order)

const toDayId = (index: number): string => `day-${index + 1}`

const toDefaultDayLabel = (index: number): string => `Day ${index + 1}`

const resolveDaysPerWeek = (routine: WithId<Routine>): DaysPerWeek => {
  const fallbackByType = routine.type === 'AB' ? 4 : 3
  const fromRoutine = routine.daysPerWeek ?? routine.dayOrder.length ?? fallbackByType
  if (fromRoutine >= 5) {
    return 5
  }
  if (fromRoutine >= 4) {
    return 4
  }
  return 3
}

const getDefaultDayOrder = (daysPerWeek: DaysPerWeek): string[] =>
  Array.from({ length: daysPerWeek }, (_, index) => toDayId(index))

const upsertActiveRoutine = async (uid: string, routineId: string | null): Promise<void> => {
  const reference = doc(db, 'users', uid)
  const snapshot = await getDoc(reference)
  const payload = {
    activeRoutineId: routineId,
    updatedAt: serverTimestamp(),
  }

  if (snapshot.exists()) {
    await updateDoc(reference, payload)
    return
  }

  await setDoc(reference, {
    displayName: 'Gym User',
    email: 'unknown@example.com',
    selectedModule: 'GYM',
    ...payload,
    createdAt: serverTimestamp(),
  })
}

const ensureRoutineDays = async (
  uid: string,
  routine: WithId<Routine>,
): Promise<Array<WithId<RoutineDay>>> => {
  const daysPerWeek = resolveDaysPerWeek(routine)
  const existingDays = await routineStore.listDays(uid, routine.id)
  const existingById = new Map(existingDays.map((day) => [day.id, day]))
  const targetDayIds = Array.from({ length: daysPerWeek }, (_, index) => toDayId(index))

  await Promise.all(
    targetDayIds.map((dayId, index) => {
      const existing = existingById.get(dayId)
      return routineStore.upsertDay(uid, routine.id, dayId, {
        label: existing?.label ?? toDefaultDayLabel(index),
        order: index,
        exerciseOrder: existing?.exerciseOrder ?? [],
      })
    }),
  )

  const targetIds = new Set(targetDayIds)
  await Promise.all(
    existingDays
      .filter((day) => !targetIds.has(day.id))
      .map((day) => routineStore.removeDay(uid, routine.id, day.id)),
  )

  if (routine.dayOrder.join('|') !== targetDayIds.join('|') || routine.daysPerWeek !== daysPerWeek) {
    await routineStore.update(uid, routine.id, {
      dayOrder: targetDayIds,
      daysPerWeek,
      type: 'CUSTOM',
    })
  }

  return routineStore.listDays(uid, routine.id)
}

export const listRoutines = async (uid: string): Promise<Array<WithId<Routine>>> =>
  routineStore.list(uid)

export const createRoutine = async (
  uid: string,
  input: Pick<NewRoutineInput, 'name' | 'daysPerWeek'>,
): Promise<string> => {
  const dayOrder = getDefaultDayOrder(input.daysPerWeek as DaysPerWeek)
  const routineId = await routineStore.create(uid, {
    name: input.name,
    daysPerWeek: input.daysPerWeek,
    type: 'CUSTOM',
    dayOrder,
  })

  await Promise.all(
    dayOrder.map((dayId, index) =>
      routineStore.upsertDay(uid, routineId, dayId, {
        label: toDefaultDayLabel(index),
        order: index,
      }),
    ),
  )

  return routineId
}

export const deleteRoutine = async (uid: string, routine: WithId<Routine>): Promise<void> => {
  await routineStore.remove(uid, routine.id)

  if (routine.isActive) {
    await upsertActiveRoutine(uid, null)
  }
}

export const setActiveRoutine = async (
  uid: string,
  routines: Array<WithId<Routine>>,
  routineId: string,
): Promise<void> => {
  await Promise.all(
    routines.map((routine) => {
      const nextIsActive = routine.id === routineId
      if (routine.isActive === nextIsActive) {
        return Promise.resolve()
      }
      return routineStore.update(uid, routine.id, { isActive: nextIsActive })
    }),
  )

  await upsertActiveRoutine(uid, routineId)
}

export const getRoutineBuilderData = async (
  uid: string,
  routineId: string,
): Promise<{
  routine: WithId<Routine>
  days: RoutineDayWithExercises[]
}> => {
  const routine = await routineStore.get(uid, routineId)
  if (!routine) {
    throw new Error('Routine not found.')
  }

  const days = await ensureRoutineDays(uid, routine)
  const daysWithExercises = await Promise.all(
    sortByOrder(days).map(async (day) => {
      const exercises = await routineStore.listDayExercises(uid, routine.id, day.id)
      return {
        ...day,
        exercises: sortByOrder(exercises).map((exercise) => ({
          ...exercise,
          targetRepsMin: exercise.targetRepsMin ?? 8,
          targetRepsMax: exercise.targetRepsMax ?? 12,
          targetSets: exercise.targetSets ?? 3,
        })),
      }
    }),
  )

  return {
    routine: {
      ...routine,
      daysPerWeek: resolveDaysPerWeek(routine),
      type: 'CUSTOM',
    },
    days: daysWithExercises,
  }
}

export const renameRoutineDay = async (
  uid: string,
  routineId: string,
  dayId: string,
  nextLabel: string,
): Promise<void> => {
  const days = await routineStore.listDays(uid, routineId)
  const currentDay = days.find((day) => day.id === dayId)

  if (!currentDay) {
    throw new Error('Routine day not found.')
  }

  await routineStore.upsertDay(uid, routineId, dayId, {
    label: nextLabel,
    order: currentDay.order,
    exerciseOrder: currentDay.exerciseOrder,
  })
}

export const replaceDayExercises = async (
  uid: string,
  routineId: string,
  dayId: string,
  exercises: Array<{
    itemId?: string
    exerciseId: string
    nameSnapshot: string
    targetRepsMin: number
    targetRepsMax: number
    targetSets: number
  }>,
): Promise<void> => {
  const previous = await routineStore.listDayExercises(uid, routineId, dayId)
  const allDays = await routineStore.listDays(uid, routineId)
  const currentDay = allDays.find((day) => day.id === dayId)
  const nextWithIds = exercises.map((item) => ({
    itemId: item.itemId ?? toItemId(),
    exerciseId: item.exerciseId,
    nameSnapshot: item.nameSnapshot,
    targetRepsMin: item.targetRepsMin,
    targetRepsMax: item.targetRepsMax,
    targetSets: item.targetSets,
  }))

  await Promise.all(
    nextWithIds.map((item, index) =>
      routineStore.upsertDayExercise(uid, routineId, dayId, item.itemId, {
        exerciseId: item.exerciseId,
        nameSnapshot: item.nameSnapshot,
        targetRepsMin: item.targetRepsMin,
        targetRepsMax: item.targetRepsMax,
        targetSets: item.targetSets,
        order: index,
      }),
    ),
  )

  const keepIds = new Set(nextWithIds.map((item) => item.itemId))
  await Promise.all(
    previous
      .filter((item) => !keepIds.has(item.id))
      .map((item) => routineStore.removeDayExercise(uid, routineId, dayId, item.id)),
  )

  await routineStore.upsertDay(uid, routineId, dayId, {
    label: currentDay?.label ?? dayId,
    order: currentDay?.order ?? 0,
    exerciseOrder: nextWithIds.map((item) => item.itemId),
  })
}
