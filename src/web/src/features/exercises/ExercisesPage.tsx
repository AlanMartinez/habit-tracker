import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import type { Exercise, WithId } from '../../shared/types/firestore'
import {
  createExercise,
  deleteExercise,
  listExercises,
  updateExercise,
} from './exercises.data'

type ExerciseFormState = {
  name: string
  primaryMuscle: string
  equipment: string
  notes: string
}

const EMPTY_FORM: ExerciseFormState = {
  name: '',
  primaryMuscle: '',
  equipment: '',
  notes: '',
}

const toFormState = (exercise: WithId<Exercise>): ExerciseFormState => ({
  name: exercise.name,
  primaryMuscle: exercise.primaryMuscle ?? '',
  equipment: exercise.equipment ?? '',
  notes: exercise.notes ?? '',
})

const formatTimestamp = (value?: Exercise['updatedAt']): string => {
  if (!value) {
    return 'Not synced yet'
  }

  return value.toDate().toLocaleDateString()
}

export const ExercisesPage = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<Array<WithId<Exercise>>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [form, setForm] = useState<ExerciseFormState>(EMPTY_FORM)
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [nameValidationMessage, setNameValidationMessage] = useState<string | null>(null)

  const loadExercises = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      const nextItems = await listExercises(user.uid)
      setItems(nextItems)
    } catch {
      setErrorMessage('Failed to load exercises.')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    void loadExercises()
  }, [user, loadExercises])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return items
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(normalizedSearch),
    )
  }, [items, searchTerm])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      return
    }

    const trimmedName = form.name.trim()
    if (trimmedName.length === 0) {
      setNameValidationMessage('Name is required.')
      return
    }

    setNameValidationMessage(null)
    setErrorMessage(null)
    setIsSaving(true)

    try {
      if (editingExerciseId) {
        await updateExercise(user.uid, editingExerciseId, {
          ...form,
          name: trimmedName,
        })
      } else {
        await createExercise(user.uid, {
          ...form,
          name: trimmedName,
        })
      }

      setForm(EMPTY_FORM)
      setEditingExerciseId(null)
      await loadExercises()
    } catch {
      setErrorMessage('Unable to save exercise. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const onEdit = (exercise: WithId<Exercise>) => {
    setEditingExerciseId(exercise.id)
    setForm(toFormState(exercise))
    setNameValidationMessage(null)
    setErrorMessage(null)
  }

  const onCancelEdit = () => {
    setEditingExerciseId(null)
    setForm(EMPTY_FORM)
    setNameValidationMessage(null)
  }

  const onDelete = async (exerciseId: string, exerciseName: string) => {
    if (!user) {
      return
    }

    const confirmed = window.confirm(`Delete "${exerciseName}"?`)
    if (!confirmed) {
      return
    }

    setErrorMessage(null)

    try {
      await deleteExercise(user.uid, exerciseId)
      await loadExercises()

      if (editingExerciseId === exerciseId) {
        onCancelEdit()
      }
    } catch {
      setErrorMessage('Unable to delete exercise. Please try again.')
    }
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl p-4">
        <p className="text-sm text-slate-600">You need to sign in to manage exercises.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-4 p-4">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Exercise Library
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Exercises</h1>
        <div className="flex gap-3 text-sm">
          <Link className="text-blue-700 underline" to="/module-select">
            Back
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          {editingExerciseId ? 'Edit Exercise' : 'New Exercise'}
        </h2>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="name">
            Name
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            id="name"
            maxLength={120}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="e.g. Incline Dumbbell Press"
            value={form.name}
          />
          {nameValidationMessage && (
            <p className="text-sm text-red-600">{nameValidationMessage}</p>
          )}

          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="primaryMuscle"
          >
            Primary muscle
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            id="primaryMuscle"
            maxLength={80}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, primaryMuscle: event.target.value }))
            }
            placeholder="Optional"
            value={form.primaryMuscle}
          />

          <label className="block text-sm font-medium text-slate-700" htmlFor="equipment">
            Equipment
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            id="equipment"
            maxLength={80}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, equipment: event.target.value }))
            }
            placeholder="Optional"
            value={form.equipment}
          />

          <label className="block text-sm font-medium text-slate-700" htmlFor="notes">
            Notes
          </label>
          <textarea
            className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            id="notes"
            maxLength={280}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Optional"
            value={form.notes}
          />

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Saving...' : editingExerciseId ? 'Save changes' : 'Add exercise'}
            </button>
            {editingExerciseId && (
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                onClick={onCancelEdit}
                type="button"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            My Exercises ({filteredItems.length})
          </h2>
          <input
            className="w-44 rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name"
            value={searchTerm}
          />
        </div>

        {errorMessage && <p className="mb-3 text-sm text-red-600">{errorMessage}</p>}

        {isLoading && <p className="text-sm text-slate-600">Loading exercises...</p>}

        {!isLoading && filteredItems.length === 0 && (
          <p className="text-sm text-slate-600">
            {items.length === 0
              ? 'No exercises yet. Add your first one above.'
              : 'No exercise matches your search.'}
          </p>
        )}

        {!isLoading && filteredItems.length > 0 && (
          <ul className="space-y-2">
            {filteredItems.map((exercise) => (
              <li
                className="rounded-md border border-slate-200 p-3"
                key={exercise.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{exercise.name}</p>
                    <p className="text-xs text-slate-600">
                      {exercise.primaryMuscle || 'No muscle selected'} •{' '}
                      {exercise.equipment || 'No equipment'}
                    </p>
                    {exercise.notes && (
                      <p className="text-xs text-slate-700">{exercise.notes}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Updated {formatTimestamp(exercise.updatedAt)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                      onClick={() => onEdit(exercise)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700"
                      onClick={() => onDelete(exercise.id, exercise.name)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
