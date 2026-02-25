import { useState } from 'react'
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
} from '../../shared/components'

type WorkoutSet = {
  id: string
  reps: string
  kg: string
  rpe: string
}

type WorkoutExercise = {
  id: string
  name: string
  sets: WorkoutSet[]
}

const createSet = (): WorkoutSet => ({
  id: crypto.randomUUID(),
  reps: '10',
  kg: '50',
  rpe: '',
})

const initialExercises: WorkoutExercise[] = [
  {
    id: 'e1',
    name: 'Lat Pulldown',
    sets: [createSet(), createSet()],
  },
]

export const LogWorkoutPage = () => {
  const [items, setItems] = useState(initialExercises)
  const [selectedExercise, setSelectedExercise] = useState('Bench Press')
  const [isSaving, setIsSaving] = useState(false)

  const addExercise = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: selectedExercise, sets: [createSet()] },
    ])
  }

  const removeExercise = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addSet = (exerciseId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === exerciseId ? { ...item, sets: [...item.sets, createSet()] } : item,
      ),
    )
  }

  const updateSet = (
    exerciseId: string,
    setId: string,
    key: 'reps' | 'kg' | 'rpe',
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === exerciseId
          ? {
              ...item,
              sets: item.sets.map((set) =>
                set.id === setId ? { ...set, [key]: value } : set,
              ),
            }
          : item,
      ),
    )
  }

  const onSave = () => {
    setIsSaving(true)
    window.setTimeout(() => {
      setIsSaving(false)
    }, 450)
  }

  return (
    <AppShell subtitle="Tue, Feb 25" title="Today: Pull">
      <Card className="space-y-2">
        <p className="text-sm text-slate-700">Active: PPL - V1</p>
        <Badge tone="info">today only edits</Badge>
      </Card>

      <Card className="space-y-3">
        <Select
          id="add-exercise"
          label="Add exercise"
          onChange={(event) => setSelectedExercise(event.target.value)}
          options={[
            { label: 'Bench Press', value: 'Bench Press' },
            { label: 'Seated Row', value: 'Seated Row' },
            { label: 'Triceps Pushdown', value: 'Triceps Pushdown' },
          ]}
          value={selectedExercise}
        />
        <Button onClick={addExercise} variant="secondary">
          Add exercise
        </Button>
      </Card>

      {items.length === 0 && (
        <EmptyState
          action={<Button onClick={addExercise}>Add exercise for today</Button>}
          description="No active routine day was found."
          title="No exercises for today"
        />
      )}

      {items.map((exercise) => (
        <Card className="space-y-3" key={exercise.id}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">{exercise.name}</h2>
            <Button onClick={() => removeExercise(exercise.id)} size="sm" variant="ghost">
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Set</span>
            <span>Reps</span>
            <span>Kg</span>
            <span>RPE</span>
          </div>

          {exercise.sets.map((set, index) => (
            <div className="grid grid-cols-4 gap-2" key={set.id}>
              <div className="flex min-h-11 items-center rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
                {index + 1}
              </div>
              <Input
                id={`reps-${set.id}`}
                label="Reps"
                onChange={(event) =>
                  updateSet(exercise.id, set.id, 'reps', event.target.value)
                }
                type="number"
                value={set.reps}
              />
              <Input
                id={`kg-${set.id}`}
                label="Kg"
                onChange={(event) => updateSet(exercise.id, set.id, 'kg', event.target.value)}
                type="number"
                value={set.kg}
              />
              <Input
                id={`rpe-${set.id}`}
                label="RPE"
                onChange={(event) => updateSet(exercise.id, set.id, 'rpe', event.target.value)}
                placeholder="-"
                type="number"
                value={set.rpe}
              />
            </div>
          ))}

          <Button onClick={() => addSet(exercise.id)} size="sm" variant="secondary">
            Add set
          </Button>
        </Card>
      ))}

      <div className="sticky bottom-20 z-10 rounded-2xl bg-slate-50 pt-2">
        <Button className="w-full shadow-[0_-4px_12px_rgba(15,23,42,0.08)]" loading={isSaving} onClick={onSave}>
          {isSaving ? 'Saving...' : 'Save Workout'}
        </Button>
      </div>
    </AppShell>
  )
}
