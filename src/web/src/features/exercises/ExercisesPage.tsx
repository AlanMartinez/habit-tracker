import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/useAuth'
import type { Exercise, WithId } from '../../shared/types/firestore'
import {
  Alert,
  AppShell,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Skeleton,
  Textarea,
} from '../../shared/components'
import {
  createExercise,
  deleteExercise,
  listExercises,
  updateExercise,
} from './exercises.data'

const emptyForm = {
  name: '',
  muscle: '',
  equipment: '',
  notes: '',
}

export const ExercisesPage = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<Array<WithId<Exercise>>>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const refreshExercises = async () => {
    if (!user) {
      setItems([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const nextItems = await listExercises(user.uid)
      setItems(nextItems)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load exercises.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshExercises()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((item) => item.name.toLowerCase().includes(query))
  }, [items, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (item: WithId<Exercise>) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      muscle: item.primaryMuscle ?? '',
      equipment: item.equipment ?? '',
      notes: item.notes ?? '',
    })
    setOpen(true)
  }

  const onSave = async () => {
    if (!user) {
      return
    }

    const trimmedName = form.name.trim()
    if (!trimmedName) {
      return
    }

    try {
      setError(null)
      if (editingId) {
        await updateExercise(user.uid, editingId, {
          name: trimmedName,
          primaryMuscle: form.muscle,
          equipment: form.equipment,
          notes: form.notes,
        })
      } else {
        await createExercise(user.uid, {
          name: trimmedName,
          primaryMuscle: form.muscle,
          equipment: form.equipment,
          notes: form.notes,
        })
      }

      setOpen(false)
      await refreshExercises()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save exercise.')
    }
  }

  const onDelete = async (id: string) => {
    if (!user) {
      return
    }

    try {
      setError(null)
      await deleteExercise(user.uid, id)
      await refreshExercises()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete exercise.')
    }
  }

  return (
    <AppShell
      rightAction={
        <Button onClick={openCreate} size="sm">
          Add
        </Button>
      }
      title="Exercises"
    >
      <Input
        id="exercise-search"
        label="Search"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search exercises"
        value={search}
      />

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
      {isLoading && <Skeleton variant="card" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          action={<Button onClick={openCreate}>Create first exercise</Button>}
          description="Add your base movement library to use in routines."
          title="No exercises yet"
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <Card className="space-y-3">
          {filtered.map((item) => (
            <article
              className="flex items-start justify-between gap-3 border-b border-[var(--border-muted)] pb-3 last:border-b-0 last:pb-0"
              key={item.id}
            >
              <div>
                <h2 className="text-base font-semibold text-[var(--text-strong)]">{item.name}</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {item.primaryMuscle || 'No muscle'} • {item.equipment || 'No equipment'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => openEdit(item)} size="sm" variant="ghost">
                  Edit
                </Button>
                <Button onClick={() => void onDelete(item.id)} size="sm" variant="secondary">
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </Card>
      )}

      <Modal
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={() => void onSave()}>Save</Button>
          </div>
        }
        onClose={() => setOpen(false)}
        open={open}
        title={editingId ? 'Edit Exercise' : 'Add Exercise'}
      >
        <Input
          id="exercise-name"
          label="Name"
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Exercise name"
          value={form.name}
        />
        <Input
          id="exercise-muscle"
          label="Muscle"
          onChange={(event) => setForm((prev) => ({ ...prev, muscle: event.target.value }))}
          placeholder="Primary muscle"
          value={form.muscle}
        />
        <Input
          id="exercise-equipment"
          label="Equipment"
          onChange={(event) => setForm((prev) => ({ ...prev, equipment: event.target.value }))}
          placeholder="Equipment"
          value={form.equipment}
        />
        <Textarea
          id="exercise-notes"
          label="Notes"
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="Optional notes"
          value={form.notes}
        />
      </Modal>
    </AppShell>
  )
}
