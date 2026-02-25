export type ExerciseLibraryItem = {
  id: string
  name: string
  muscle: string
  equipment: string
  notes: string
}

const EXERCISE_STORAGE_KEY = 'habit-tracker.exercises.v1'

const fallbackExercises: ExerciseLibraryItem[] = [
  { id: '1', name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell', notes: '' },
  { id: '2', name: 'Incline DB Press', muscle: 'Chest', equipment: 'Dumbbells', notes: '' },
  { id: '3', name: 'Leg Press', muscle: 'Quads', equipment: 'Machine', notes: '' },
  { id: '4', name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cable', notes: '' },
]

const toId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const readExercises = (): ExerciseLibraryItem[] => {
  if (typeof window === 'undefined') {
    return fallbackExercises
  }

  const raw = window.localStorage.getItem(EXERCISE_STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(EXERCISE_STORAGE_KEY, JSON.stringify(fallbackExercises))
    return fallbackExercises
  }

  try {
    const parsed = JSON.parse(raw) as ExerciseLibraryItem[]
    if (!Array.isArray(parsed)) {
      return fallbackExercises
    }
    return parsed
  } catch {
    return fallbackExercises
  }
}

const writeExercises = (items: ExerciseLibraryItem[]): void => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(EXERCISE_STORAGE_KEY, JSON.stringify(items))
}

export const listExerciseLibrary = (): ExerciseLibraryItem[] => readExercises()

export const createExerciseLibraryItem = (
  input: Omit<ExerciseLibraryItem, 'id'>,
): ExerciseLibraryItem => {
  const next = {
    id: toId(),
    ...input,
  }
  const items = readExercises()
  writeExercises([...items, next])
  return next
}

export const updateExerciseLibraryItem = (
  id: string,
  input: Omit<ExerciseLibraryItem, 'id'>,
): void => {
  const items = readExercises()
  writeExercises(items.map((item) => (item.id === id ? { id, ...input } : item)))
}

export const deleteExerciseLibraryItem = (id: string): void => {
  const items = readExercises()
  writeExercises(items.filter((item) => item.id !== id))
}
