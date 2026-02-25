import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { routineStore } from '../../firebase/firestore'
import { db } from '../../firebase/firebase'
import type {
  NewRoutineInput,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  RoutineType,
  WithId,
} from '../../shared/types/firestore'

type TemplateDay = {
  id: string
  label: string
}

export type RoutineDayWithExercises = WithId<RoutineDay> & {
  exercises: Array<WithId<RoutineDayExercise>>
}

const TEMPLATE_DAYS: Record<RoutineType, TemplateDay[]> = {
  AB: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ],
  PPL: [
    { id: 'push', label: 'Push' },
    { id: 'pull', label: 'Pull' },
    { id: 'legs', label: 'Legs' },
  ],
}

const DEFAULT_DAY_ORDER: Record<RoutineType, string[]> = {
  AB: ['a', 'b', 'a', 'b'],
  PPL: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
}

const toItemId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order)

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

export const getTemplateDays = (type: RoutineType): TemplateDay[] => TEMPLATE_DAYS[type]

export const getDefaultDayOrder = (type: RoutineType): string[] => DEFAULT_DAY_ORDER[type]

const ensureRoutineDays = async (
  uid: string,
  routineId: string,
  type: RoutineType,
): Promise<Array<WithId<RoutineDay>>> => {
  const existingDays = await routineStore.listDays(uid, routineId)
  const templateIds = new Set(getTemplateDays(type).map((day) => day.id))
  const templateDays = getTemplateDays(type)

  await Promise.all(
    templateDays.map((day, index) =>
      routineStore.upsertDay(uid, routineId, day.id, {
        label: day.label,
        order: index,
      }),
    ),
  )

  if (existingDays.length > templateDays.length) {
    await Promise.all(
      existingDays
        .filter((day) => !templateIds.has(day.id))
        .map((day) => routineStore.removeDay(uid, routineId, day.id)),
    )
  }

  return routineStore.listDays(uid, routineId)
}

export const listRoutines = async (uid: string): Promise<Array<WithId<Routine>>> =>
  routineStore.list(uid)

export const createRoutine = async (
  uid: string,
  input: Pick<NewRoutineInput, 'name' | 'type'>,
): Promise<string> => {
  const routineId = await routineStore.create(uid, {
    ...input,
    dayOrder: getDefaultDayOrder(input.type),
  })

  const templateDays = getTemplateDays(input.type)
  await Promise.all(
    templateDays.map((day, index) =>
      routineStore.upsertDay(uid, routineId, day.id, {
        label: day.label,
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

  const days = await ensureRoutineDays(uid, routine.id, routine.type)
  const daysWithExercises = await Promise.all(
    sortByOrder(days).map(async (day) => {
      const exercises = await routineStore.listDayExercises(uid, routine.id, day.id)
      return {
        ...day,
        exercises: sortByOrder(exercises),
      }
    }),
  )

  return {
    routine,
    days: daysWithExercises,
  }
}

export const updateRoutineSchedule = async (
  uid: string,
  routineId: string,
  dayOrder: string[],
): Promise<void> => {
  await routineStore.update(uid, routineId, { dayOrder })
}

export const replaceDayExercises = async (
  uid: string,
  routineId: string,
  dayId: string,
  exercises: Array<{ itemId?: string; exerciseId: string; nameSnapshot: string }>,
): Promise<void> => {
  const previous = await routineStore.listDayExercises(uid, routineId, dayId)
  const allDays = await routineStore.listDays(uid, routineId)
  const currentDay = allDays.find((day) => day.id === dayId)
  const nextWithIds = exercises.map((item) => ({
    itemId: item.itemId ?? toItemId(),
    exerciseId: item.exerciseId,
    nameSnapshot: item.nameSnapshot,
  }))

  await Promise.all(
    nextWithIds.map((item, index) =>
      routineStore.upsertDayExercise(uid, routineId, dayId, item.itemId, {
        exerciseId: item.exerciseId,
        nameSnapshot: item.nameSnapshot,
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
