import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Select,
} from '../../shared/components'
import { getTodayWorkoutDraft, type WorkoutDraft } from './workout.data'

const getDateLabel = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)

export const WorkoutDashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [context, setContext] = useState<WorkoutDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dayPickerOpen, setDayPickerOpen] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setContext(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const nextContext = await getTodayWorkoutDraft(user.uid)
        setContext(nextContext)
        setSelectedDayId(nextContext.routineDayId ?? nextContext.routineDays[0]?.id ?? '')
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Unable to load workout context.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [user])

  const onStartWorkout = () => {
    if (!context?.routineId) {
      return
    }
    setDayPickerOpen(true)
  }

  const selectedDayLabel =
    context?.routineDays.find((day) => day.id === selectedDayId)?.label ??
    context?.routineDayLabel ??
    'Day'

  return (
    <AppShell subtitle={getDateLabel(new Date())} title="Workout">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Loading workout...</p>}

      {!isLoading && context && !context.routineId && (
        <EmptyState
          action={<Button onClick={() => navigate('/app/routines')}>Create routine</Button>}
          description="Set an active routine first to auto-load your daily workout."
          title="No active routine"
        />
      )}

      {!isLoading && context && context.routineId && (
        <>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                {context.routineName ?? 'Routine'}
              </p>
              <Badge tone="active">Active routine</Badge>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Selected day: {selectedDayLabel} - {context.exercises.length} exercises
            </p>
            <Button className="w-full" onClick={onStartWorkout} size="lg">
              Start workout
            </Button>
          </Card>

          <Card className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              Session Preview
            </h2>
            {context.exercises.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">
                No exercises assigned for today. You can add ad-hoc exercises in the log screen.
              </p>
            )}
            {context.exercises.map((exercise) => (
              <div
                className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--surface-2)] px-3 py-2"
                key={exercise.id}
              >
                <span className="text-sm font-medium text-[var(--text-strong)]">{exercise.nameSnapshot}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {exercise.targetRepsMin ?? 8}-{exercise.targetRepsMax ?? 12} reps x {exercise.targetSets ?? 1} sets
                </span>
              </div>
            ))}
          </Card>
        </>
      )}

      <Modal
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDayPickerOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedDayId) {
                  return
                }
                navigate(`/app/workout/log?dayId=${encodeURIComponent(selectedDayId)}`)
              }}
            >
              Continue
            </Button>
          </div>
        }
        onClose={() => setDayPickerOpen(false)}
        open={dayPickerOpen}
        title="Select routine day"
      >
        <Select
          id="workout-day"
          label="Routine day"
          onChange={(event) => setSelectedDayId(event.target.value)}
          options={(context?.routineDays ?? []).map((day) => ({
            label: day.label,
            value: day.id,
          }))}
          value={selectedDayId}
        />
      </Modal>
    </AppShell>
  )
}
