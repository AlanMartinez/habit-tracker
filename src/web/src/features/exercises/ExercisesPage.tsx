import { useMemo, useState } from 'react'
import {
  AppShell,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Skeleton,
  Textarea,
} from '../../shared/components'

type ExerciseItem = {
  id: string
  name: string
  muscle: string
  equipment: string
  notes: string
}

const initialExercises: ExerciseItem[] = [
  { id: '1', name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell', notes: '' },
  { id: '2', name: 'Incline DB Press', muscle: 'Chest', equipment: 'Dumbbells', notes: '' },
  { id: '3', name: 'Leg Press', muscle: 'Quads', equipment: 'Machine', notes: '' },
]

const emptyForm = {
  name: '',
  muscle: '',
  equipment: '',
  notes: '',
}

export const ExercisesPage = () => {
  const [items, setItems] = useState<ExerciseItem[]>(initialExercises)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)

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

  const openEdit = (item: ExerciseItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      muscle: item.muscle,
      equipment: item.equipment,
      notes: item.notes,
    })
    setOpen(true)
  }

  const onSave = () => {
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      return
    }

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { id: editingId, ...form, name: trimmedName } : item,
        ),
      )
    } else {
      setItems((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ...form, name: trimmedName },
      ])
    }

    setOpen(false)
  }

  const onDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
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
            <article className="flex items-start justify-between gap-3 border-b border-violet-100 dark:border-violet-900/60 pb-3 last:border-b-0 last:pb-0" key={item.id}>
              <div>
                <h2 className="text-base font-semibold text-violet-950 dark:text-violet-100">{item.name}</h2>
                <p className="text-xs text-violet-500 dark:text-violet-400">{item.muscle}  {item.equipment}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => openEdit(item)} size="sm" variant="ghost">
                  Edit
                </Button>
                <Button onClick={() => onDelete(item.id)} size="sm" variant="secondary">
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
            <Button onClick={onSave}>Save</Button>
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
