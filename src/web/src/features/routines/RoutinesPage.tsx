import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import type { Routine, RoutineType, WithId } from '../../shared/types/firestore'
import {
  createRoutine,
  deleteRoutine,
  listRoutines,
  setActiveRoutine,
} from './routines.data'

const ROUTINE_OPTIONS: Array<{ value: RoutineType; label: string }> = [
  { value: 'AB', label: 'A/B' },
  { value: 'PPL', label: 'Push/Pull/Legs' },
]

export const RoutinesPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<Array<WithId<Routine>>>([])
  const [name, setName] = useState('')
  const [type, setType] = useState<RoutineType>('AB')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [actionRoutineId, setActionRoutineId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const loadRoutines = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      const nextItems = await listRoutines(user.uid)
      setItems(nextItems)
    } catch {
      setErrorMessage('Failed to load routines.')
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
    void loadRoutines()
  }, [loadRoutines, user])

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      setValidationMessage('Name is required.')
      return
    }

    setValidationMessage(null)
    setErrorMessage(null)
    setIsSaving(true)

    try {
      const routineId = await createRoutine(user.uid, {
        name: trimmedName,
        type,
      })
      setName('')
      await loadRoutines()
      navigate(`/routine-builder/${routineId}`)
    } catch {
      setErrorMessage('Unable to create routine.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async (routine: WithId<Routine>) => {
    if (!user) {
      return
    }

    const confirmed = window.confirm(`Delete "${routine.name}"?`)
    if (!confirmed) {
      return
    }

    setErrorMessage(null)
    setActionRoutineId(routine.id)

    try {
      await deleteRoutine(user.uid, routine)
      await loadRoutines()
    } catch {
      setErrorMessage('Unable to delete routine.')
    } finally {
      setActionRoutineId(null)
    }
  }

  const onSetActive = async (routineId: string) => {
    if (!user) {
      return
    }

    setErrorMessage(null)
    setActionRoutineId(routineId)

    try {
      await setActiveRoutine(user.uid, items, routineId)
      await loadRoutines()
    } catch {
      setErrorMessage('Unable to set active routine.')
    } finally {
      setActionRoutineId(null)
    }
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl p-4">
        <p className="text-sm text-slate-600">You need to sign in to manage routines.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-4 p-4">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Routine Templates
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Routines</h1>
        <div className="flex gap-3 text-sm">
          <Link className="text-blue-700 underline" to="/module-select">
            Back
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Create Routine</h2>
        <form className="space-y-3" onSubmit={onCreate}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="routineName">
            Name
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            id="routineName"
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Base Strength Split"
            value={name}
          />
          {validationMessage && <p className="text-sm text-red-600">{validationMessage}</p>}

          <label className="block text-sm font-medium text-slate-700" htmlFor="routineType">
            Template
          </label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            id="routineType"
            onChange={(event) => setType(event.target.value as RoutineType)}
            value={type}
          >
            {ROUTINE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Creating...' : 'Create routine'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">My Routines ({items.length})</h2>
        {errorMessage && <p className="mb-3 text-sm text-red-600">{errorMessage}</p>}
        {isLoading && <p className="text-sm text-slate-600">Loading routines...</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-slate-600">No routines yet. Create one above.</p>
        )}

        {!isLoading && items.length > 0 && (
          <ul className="space-y-2">
            {items.map((routine) => (
              <li className="rounded-md border border-slate-200 p-3" key={routine.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{routine.name}</p>
                    <p className="text-xs text-slate-600">{routine.type} template</p>
                    {routine.isActive && (
                      <p className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Active routine
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                      onClick={() => navigate(`/routine-builder/${routine.id}`)}
                      type="button"
                    >
                      Open
                    </button>
                    {!routine.isActive && (
                      <button
                        className="rounded border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 disabled:opacity-60"
                        disabled={actionRoutineId === routine.id}
                        onClick={() => onSetActive(routine.id)}
                        type="button"
                      >
                        Set as active
                      </button>
                    )}
                    <button
                      className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-60"
                      disabled={actionRoutineId === routine.id}
                      onClick={() => onDelete(routine)}
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
