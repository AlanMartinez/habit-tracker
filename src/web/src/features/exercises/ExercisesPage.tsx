import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/useAuth'
import type { Exercise, ExerciseMachine, WithId } from '../../shared/types/firestore'
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
import { cn } from '../../shared/lib/cn'
import {
  createExercise,
  createMachine,
  deleteExercise,
  deleteMachine,
  listExercises,
  listMachines,
  updateExercise,
  updateMachine,
} from './exercises.data'

type Tab = 'exercises' | 'machines'

const emptyForm = {
  name: '',
  muscle: '',
  equipment: '',
  notes: '',
}

export const ExercisesPage = () => {
  const { user } = useAuth()

  // --- Shared state ---
  const [activeTab, setActiveTab] = useState<Tab>('exercises')
  const [items, setItems] = useState<Array<WithId<Exercise>>>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Exercises tab state ---
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  // --- Machines tab state ---
  const [machinesByExercise, setMachinesByExercise] = useState<
    Record<string, Array<WithId<ExerciseMachine>>>
  >({})
  const [loadingMachineIds, setLoadingMachineIds] = useState<Set<string>>(new Set())
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null)
  const [addMachineForm, setAddMachineForm] = useState<{ exerciseId: string; label: string } | null>(null)
  const [editMachineForm, setEditMachineForm] = useState<{
    exerciseId: string
    machineId: string
    label: string
  } | null>(null)
  const [machineError, setMachineError] = useState<string | null>(null)

  // --- Load exercises ---
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
    if (!query) return items
    return items.filter((item) => item.name.toLowerCase().includes(query))
  }, [items, search])

  // --- Exercises tab handlers ---
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
    if (!user) return
    const trimmedName = form.name.trim()
    if (!trimmedName) return

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
    if (!user) return

    try {
      setError(null)
      await deleteExercise(user.uid, id)
      await refreshExercises()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete exercise.')
    }
  }

  // --- Machines tab handlers ---
  const loadMachinesForExercise = async (exerciseId: string) => {
    if (!user) return
    setLoadingMachineIds((prev) => new Set(prev).add(exerciseId))
    try {
      const machines = await listMachines(user.uid, exerciseId)
      setMachinesByExercise((prev) => ({ ...prev, [exerciseId]: machines }))
    } finally {
      setLoadingMachineIds((prev) => {
        const next = new Set(prev)
        next.delete(exerciseId)
        return next
      })
    }
  }

  const toggleExpand = async (exerciseId: string) => {
    if (expandedExerciseId === exerciseId) {
      setExpandedExerciseId(null)
      setAddMachineForm(null)
      setEditMachineForm(null)
      return
    }
    setExpandedExerciseId(exerciseId)
    setAddMachineForm(null)
    setEditMachineForm(null)
    if (!machinesByExercise[exerciseId]) {
      await loadMachinesForExercise(exerciseId)
    }
  }

  const onAddMachine = async () => {
    if (!user || !addMachineForm) return
    const label = addMachineForm.label.trim()
    if (!label) return

    setMachineError(null)
    try {
      const current = machinesByExercise[addMachineForm.exerciseId] ?? []
      await createMachine(user.uid, addMachineForm.exerciseId, {
        label,
        order: current.length,
      })
      await loadMachinesForExercise(addMachineForm.exerciseId)
      setAddMachineForm(null)
    } catch (nextError) {
      setMachineError(nextError instanceof Error ? nextError.message : 'Unable to add machine.')
    }
  }

  const onEditMachine = async () => {
    if (!user || !editMachineForm) return
    const label = editMachineForm.label.trim()
    if (!label) return

    setMachineError(null)
    try {
      await updateMachine(user.uid, editMachineForm.exerciseId, editMachineForm.machineId, {
        label,
      })
      await loadMachinesForExercise(editMachineForm.exerciseId)
      setEditMachineForm(null)
    } catch (nextError) {
      setMachineError(nextError instanceof Error ? nextError.message : 'Unable to update machine.')
    }
  }

  const onDeleteMachine = async (exerciseId: string, machineId: string) => {
    if (!user) return

    setMachineError(null)
    try {
      await deleteMachine(user.uid, exerciseId, machineId)
      // Re-order remaining machines
      const remaining = (machinesByExercise[exerciseId] ?? []).filter((m) => m.id !== machineId)
      await Promise.all(
        remaining.map((m, i) => updateMachine(user.uid, exerciseId, m.id, { order: i })),
      )
      await loadMachinesForExercise(exerciseId)
    } catch (nextError) {
      setMachineError(nextError instanceof Error ? nextError.message : 'Unable to delete machine.')
    }
  }

  const onMoveMachine = async (
    exerciseId: string,
    machineId: string,
    direction: 'up' | 'down',
  ) => {
    if (!user) return

    const machines = machinesByExercise[exerciseId] ?? []
    const index = machines.findIndex((m) => m.id === machineId)
    if (index < 0) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= machines.length) return

    setMachineError(null)
    try {
      const reordered = [...machines]
      ;[reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]]
      await Promise.all(
        reordered.map((m, i) => updateMachine(user.uid, exerciseId, m.id, { order: i })),
      )
      await loadMachinesForExercise(exerciseId)
    } catch (nextError) {
      setMachineError(nextError instanceof Error ? nextError.message : 'Unable to reorder machine.')
    }
  }

  return (
    <AppShell
      rightAction={
        activeTab === 'exercises' ? (
          <Button onClick={openCreate} size="sm">
            Add
          </Button>
        ) : null
      }
      title="Exercises"
    >
      {/* Tab toggle */}
      <div className="flex overflow-hidden rounded-lg border border-[var(--border)]">
        <button
          className={cn(
            'flex-1 py-2 text-sm font-medium transition-colors',
            activeTab === 'exercises'
              ? 'bg-[var(--surface-3)] text-[var(--text-strong)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]',
          )}
          onClick={() => setActiveTab('exercises')}
        >
          Exercises
        </button>
        <button
          className={cn(
            'flex-1 py-2 text-sm font-medium transition-colors',
            activeTab === 'machines'
              ? 'bg-[var(--surface-3)] text-[var(--text-strong)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]',
          )}
          onClick={() => setActiveTab('machines')}
        >
          Machines
        </button>
      </div>

      {/* Search (shared) */}
      <Input
        id="exercise-search"
        label="Search"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search exercises"
        value={search}
      />

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
      {isLoading && <Skeleton variant="card" />}

      {/* ── EXERCISES TAB ── */}
      {activeTab === 'exercises' && !isLoading && filtered.length === 0 && (
        <EmptyState
          action={<Button onClick={openCreate}>Create first exercise</Button>}
          description="Add your base movement library to use in routines."
          title="No exercises yet"
        />
      )}

      {activeTab === 'exercises' && !isLoading && filtered.length > 0 && (
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

      {/* ── MACHINES TAB ── */}
      {activeTab === 'machines' && !isLoading && filtered.length === 0 && (
        <EmptyState
          description="Create exercises first to assign machines to them."
          title="No exercises yet"
        />
      )}

      {activeTab === 'machines' && !isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {machineError && <p className="text-sm text-red-600">{machineError}</p>}

          {filtered.map((exercise) => {
            const machines = machinesByExercise[exercise.id] ?? []
            const isExpanded = expandedExerciseId === exercise.id
            const isLoadingMachines = loadingMachineIds.has(exercise.id)

            return (
              <Card key={exercise.id} className="space-y-0">
                {/* Exercise row — click to expand */}
                <button
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => void toggleExpand(exercise.id)}
                >
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text-strong)]">
                      {exercise.name}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {exercise.primaryMuscle || 'No muscle'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {machinesByExercise[exercise.id] !== undefined && (
                      <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                        {machines.length} {machines.length === 1 ? 'machine' : 'machines'}
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Expanded machine list */}
                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-[var(--border-muted)] pt-3">
                    {isLoadingMachines && (
                      <p className="text-sm text-[var(--text-muted)]">Loading machines...</p>
                    )}

                    {!isLoadingMachines && machines.length === 0 && (
                      <p className="text-sm text-[var(--text-muted)]">No machines yet.</p>
                    )}

                    {!isLoadingMachines &&
                      machines.map((machine, index) => {
                        const isEditing =
                          editMachineForm?.machineId === machine.id &&
                          editMachineForm.exerciseId === exercise.id

                        return (
                          <div
                            key={machine.id}
                            className="flex items-center gap-2 rounded-lg border border-[var(--border-muted)] bg-[var(--surface-1)] px-3 py-2"
                          >
                            {/* Default badge */}
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                index === 0
                                  ? 'bg-[var(--accent)] text-white'
                                  : 'bg-[var(--surface-2)] text-[var(--text-muted)]',
                              )}
                            >
                              {index === 0 ? 'Default' : `#${index + 1}`}
                            </span>

                            {/* Label (or edit input) */}
                            {isEditing ? (
                              <Input
                                id={`edit-machine-${machine.id}`}
                                label=""
                                onChange={(e) =>
                                  setEditMachineForm((prev) =>
                                    prev ? { ...prev, label: e.target.value } : null,
                                  )
                                }
                                placeholder="Machine label"
                                value={editMachineForm?.label ?? ''}
                                className="flex-1"
                              />
                            ) : (
                              <span className="flex-1 text-sm text-[var(--text)]">
                                {machine.label}
                              </span>
                            )}

                            {/* Actions */}
                            <div className="flex shrink-0 items-center gap-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    onClick={() => void onEditMachine()}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    onClick={() => setEditMachineForm(null)}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    ✕
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() =>
                                      setEditMachineForm({
                                        exerciseId: exercise.id,
                                        machineId: machine.id,
                                        label: machine.label,
                                      })
                                    }
                                    size="sm"
                                    variant="ghost"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      void onDeleteMachine(exercise.id, machine.id)
                                    }
                                    size="sm"
                                    variant="ghost"
                                  >
                                    ✕
                                  </Button>
                                  <button
                                    className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30"
                                    disabled={index === 0}
                                    onClick={() =>
                                      void onMoveMachine(exercise.id, machine.id, 'up')
                                    }
                                  >
                                    ↑
                                  </button>
                                  <button
                                    className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30"
                                    disabled={index === machines.length - 1}
                                    onClick={() =>
                                      void onMoveMachine(exercise.id, machine.id, 'down')
                                    }
                                  >
                                    ↓
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}

                    {/* Add machine form or button */}
                    {addMachineForm?.exerciseId === exercise.id ? (
                      <div className="flex items-end gap-2 pt-1">
                        <Input
                          id={`add-machine-${exercise.id}`}
                          label="New machine"
                          onChange={(e) =>
                            setAddMachineForm((prev) =>
                              prev ? { ...prev, label: e.target.value } : null,
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void onAddMachine()
                          }}
                          placeholder="Machine label"
                          value={addMachineForm.label}
                          className="flex-1"
                        />
                        <Button onClick={() => void onAddMachine()} size="sm">
                          Add
                        </Button>
                        <Button
                          onClick={() => setAddMachineForm(null)}
                          size="sm"
                          variant="ghost"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="mt-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                        onClick={() => {
                          setEditMachineForm(null)
                          setAddMachineForm({ exerciseId: exercise.id, label: '' })
                        }}
                      >
                        + Add machine
                      </button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Exercise create/edit modal */}
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
