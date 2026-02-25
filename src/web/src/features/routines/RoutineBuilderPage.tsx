import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell, Button, Card, Drawer, EmptyState, Select } from '../../shared/components'

type DayKey = 'push' | 'pull' | 'legs'

type RoutineDay = {
  key: DayKey
  label: string
  exercises: string[]
}

const initialDays: RoutineDay[] = [
  { key: 'push', label: 'Push', exercises: ['Bench Press', 'Incline DB Press'] },
  { key: 'pull', label: 'Pull', exercises: ['Lat Pulldown', 'Seated Row'] },
  { key: 'legs', label: 'Legs', exercises: ['Leg Press'] },
]

const exerciseOptions = [
  { label: 'Bench Press', value: 'Bench Press' },
  { label: 'Lat Pulldown', value: 'Lat Pulldown' },
  { label: 'Romanian Deadlift', value: 'Romanian Deadlift' },
]

export const RoutineBuilderPage = () => {
  const navigate = useNavigate()
  const { routineId } = useParams<{ routineId: string }>()
  const [days, setDays] = useState(initialDays)
  const [activeDay, setActiveDay] = useState<DayKey>('push')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [newExercise, setNewExercise] = useState(exerciseOptions[0]?.value ?? '')

  const selectedDay = useMemo(
    () => days.find((item) => item.key === activeDay) ?? days[0],
    [activeDay, days],
  )

  const onAdd = () => {
    if (!newExercise) {
      return
    }

    setDays((prev) =>
      prev.map((item) =>
        item.key === activeDay
          ? { ...item, exercises: [...item.exercises, newExercise] }
          : item,
      ),
    )
    setPickerOpen(false)
  }

  const onRemove = (index: number) => {
    setDays((prev) =>
      prev.map((item) =>
        item.key === activeDay
          ? {
              ...item,
              exercises: item.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
            }
          : item,
      ),
    )
  }

  return (
    <AppShell
      onBack={() => navigate('/app/routines')}
      rightAction={<Button size="sm">Save</Button>}
      subtitle={routineId ? `Routine ${routineId}` : 'Routine Builder'}
      title="PPL - V1"
    >
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <Button
              key={day.key}
              onClick={() => setActiveDay(day.key)}
              size="sm"
              variant={activeDay === day.key ? 'primary' : 'secondary'}
            >
              {day.label}
            </Button>
          ))}
        </div>
        <Button onClick={() => setPickerOpen(true)} size="sm" variant="secondary">
          Add exercise
        </Button>
      </Card>

      {selectedDay.exercises.length === 0 && (
        <EmptyState
          action={<Button onClick={() => setPickerOpen(true)}>Add exercise</Button>}
          description="This day has no configured exercises yet."
          title="No exercises for this day"
        />
      )}

      {selectedDay.exercises.length > 0 && (
        <Card className="space-y-2">
          {selectedDay.exercises.map((exercise, index) => (
            <div className="flex items-center justify-between rounded-lg border border-violet-200 dark:border-violet-800 p-3" key={`${exercise}-${index}`}>
              <div>
                <p className="text-sm font-semibold text-violet-950 dark:text-violet-100">{exercise}</p>
                <p className="text-xs text-violet-500 dark:text-violet-400">Drag placeholder [::]</p>
              </div>
              <Button onClick={() => onRemove(index)} size="sm" variant="ghost">
                Remove
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Drawer onClose={() => setPickerOpen(false)} open={pickerOpen} title="Add Exercise">
        <div className="space-y-4">
          <Select
            id="builder-exercise"
            label="Exercise"
            onChange={(event) => setNewExercise(event.target.value)}
            options={exerciseOptions}
            value={newExercise}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPickerOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={onAdd}>Add</Button>
          </div>
        </div>
      </Drawer>
    </AppShell>
  )
}
