import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/useAuth'
import { Alert, AppShell, Button, Card, Drawer, EmptyState, Skeleton } from '../../shared/components'
import {
  getWorkoutSessionDetail,
  listWorkoutsForMonth,
  type WorkoutSessionDetail,
} from './history.data'

const weekdayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const startOfMonth = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), 1)

const monthLabel = (value: Date): string =>
  new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(value)

const dateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, (month ?? 1) - 1, day ?? 1))
}

const buildMonthCells = (month: Date) => {
  const firstDay = startOfMonth(month)
  const offset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - offset + 1
    if (dayNumber <= 0 || dayNumber > daysInMonth) {
      return { dateKey: '', label: '' }
    }

    const monthPart = `${month.getMonth() + 1}`.padStart(2, '0')
    const dayPart = `${dayNumber}`.padStart(2, '0')
    return {
      dateKey: `${month.getFullYear()}-${monthPart}-${dayPart}`,
      label: String(dayNumber),
    }
  })
}

export const HistoryPage = () => {
  const { user } = useAuth()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setWorkoutsByDate({})
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const sessions = await listWorkoutsForMonth(user.uid, month)
        setWorkoutsByDate(
          Object.fromEntries(sessions.map((session) => [session.date, session.id])),
        )
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Unable to load workout history.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [user, month])

  useEffect(() => {
    const loadDetail = async () => {
      if (!user || !selectedSessionId) {
        setSelectedSession(null)
        return
      }

      setIsDetailLoading(true)
      setError(null)

      try {
        const detail = await getWorkoutSessionDetail(user.uid, selectedSessionId)
        setSelectedSession(detail)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Unable to load workout detail.')
      } finally {
        setIsDetailLoading(false)
      }
    }

    void loadDetail()
  }, [user, selectedSessionId])

  const monthCells = useMemo(() => buildMonthCells(month), [month])

  const drawerTitle = selectedSession ? dateLabel(selectedSession.date) : 'Workout detail'

  return (
    <AppShell title="History">
      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

      {isLoading && <Skeleton variant="calendar" />}

      {!isLoading && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() =>
                setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              size="sm"
              variant="ghost"
            >
              Prev
            </Button>
            <h2 className="text-lg font-semibold text-[var(--text-strong)]">{monthLabel(month)}</h2>
            <Button
              onClick={() =>
                setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              size="sm"
              variant="ghost"
            >
              Next
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--text-muted)]">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((cell, index) => {
              const hasWorkout = Boolean(cell.dateKey && workoutsByDate[cell.dateKey])

              return (
                <button
                  className="min-h-11 rounded-lg border border-[var(--border)] p-1 text-sm text-[var(--text)] disabled:border-transparent disabled:bg-transparent"
                  disabled={cell.label.length === 0}
                  key={`${cell.dateKey}-${index}`}
                  onClick={() => {
                    if (!hasWorkout || !cell.dateKey) {
                      return
                    }
                    setSelectedSessionId(workoutsByDate[cell.dateKey])
                  }}
                  type="button"
                >
                  <span className="block">{cell.label}</span>
                  {hasWorkout && (
                    <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  )}
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {!isLoading && Object.keys(workoutsByDate).length === 0 && (
        <EmptyState
          description="No workouts found for this month."
          title="No history yet"
        />
      )}

      <Drawer
        onClose={() => {
          setSelectedSessionId(null)
          setSelectedSession(null)
        }}
        open={Boolean(selectedSessionId)}
        title={drawerTitle}
      >
        {isDetailLoading && <p className="text-sm text-[var(--text-muted)]">Loading workout detail...</p>}

        {!isDetailLoading && selectedSession && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text)]">
              {selectedSession.routineDayLabel || 'Routine day'}
            </p>
            {selectedSession.exercises.map((exercise) => (
              <div className="rounded-lg border border-[var(--border)] p-3" key={exercise.id}>
                <p className="text-sm font-semibold text-[var(--text-strong)]">{exercise.nameSnapshot}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {exercise.sets
                    .map((set) => {
                      const rirSuffix = set.rpe === undefined ? '' : ` RIR ${set.rpe}`
                      return `${set.reps} x ${set.weightKg}kg${rirSuffix}`
                    })
                    .join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </AppShell>
  )
}
