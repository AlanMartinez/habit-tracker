import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import type { WithId, WorkoutSession } from '../../shared/types/firestore'
import {
  getWorkoutSessionDetail,
  listWorkoutsForMonth,
  type WorkoutSessionDetail,
} from './history.data'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toIsoDate = (value: Date): string => {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fromIsoDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const monthLabel = (value: Date): string =>
  value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

const dayLabel = (value: string): string =>
  fromIsoDate(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

const buildCalendarDays = (month: Date): Date[] => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const leadingDays = start.getDay()
  const totalDays = end.getDate()
  const items: Date[] = []

  for (let index = 0; index < leadingDays; index += 1) {
    items.push(new Date(month.getFullYear(), month.getMonth(), index - leadingDays + 1))
  }

  for (let day = 1; day <= totalDays; day += 1) {
    items.push(new Date(month.getFullYear(), month.getMonth(), day))
  }

  const trailingDays = (7 - (items.length % 7)) % 7
  for (let index = 1; index <= trailingDays; index += 1) {
    items.push(new Date(month.getFullYear(), month.getMonth() + 1, index))
  }

  return items
}

export const HistoryPage = () => {
  const { user } = useAuth()
  const [activeMonth, setActiveMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )
  const [monthSessions, setMonthSessions] = useState<Array<WithId<WorkoutSession>>>([])
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()))
  const [selectedDetails, setSelectedDetails] = useState<WorkoutSessionDetail[]>([])
  const [isLoadingMonth, setIsLoadingMonth] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dayToSessions = useMemo(() => {
    const grouped = new Map<string, Array<WithId<WorkoutSession>>>()
    monthSessions.forEach((session) => {
      const current = grouped.get(session.date) ?? []
      current.push(session)
      grouped.set(session.date, current)
    })
    return grouped
  }, [monthSessions])

  const calendarDays = useMemo(() => buildCalendarDays(activeMonth), [activeMonth])
  const activeMonthKey = `${activeMonth.getFullYear()}-${activeMonth.getMonth()}`

  const loadMonth = useCallback(async () => {
    if (!user) {
      setIsLoadingMonth(false)
      return
    }

    setIsLoadingMonth(true)
    setErrorMessage(null)

    try {
      const sessions = await listWorkoutsForMonth(user.uid, activeMonth)
      setMonthSessions(sessions)
    } catch {
      setErrorMessage('Failed to load workouts for this month.')
      setMonthSessions([])
    } finally {
      setIsLoadingMonth(false)
    }
  }, [activeMonth, user])

  useEffect(() => {
    void loadMonth()
  }, [loadMonth])

  useEffect(() => {
    const selected = fromIsoDate(selectedDate)
    if (
      selected.getFullYear() !== activeMonth.getFullYear() ||
      selected.getMonth() !== activeMonth.getMonth()
    ) {
      setSelectedDate(toIsoDate(activeMonth))
    }
  }, [activeMonth, selectedDate])

  useEffect(() => {
    if (!user) {
      return
    }

    const sessions = dayToSessions.get(selectedDate) ?? []
    if (sessions.length === 0) {
      setSelectedDetails([])
      return
    }

    let isMounted = true
    setIsLoadingDetails(true)
    setErrorMessage(null)

    void Promise.all(
      sessions.map((session) => getWorkoutSessionDetail(user.uid, session.id)),
    )
      .then((details) => {
        if (!isMounted) {
          return
        }
        setSelectedDetails(details)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }
        setErrorMessage('Failed to load workout details for this day.')
        setSelectedDetails([])
      })
      .finally(() => {
        if (!isMounted) {
          return
        }
        setIsLoadingDetails(false)
      })

    return () => {
      isMounted = false
    }
  }, [dayToSessions, selectedDate, user])

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl p-4">
        <p className="text-sm text-slate-600">You need to sign in to view history.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-4 p-4">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Workout History
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">History</h1>
        <div className="flex gap-3 text-sm">
          <Link className="text-blue-700 underline" to="/module-select">
            Back
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
            onClick={() => {
              setActiveMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }}
            type="button"
          >
            Prev
          </button>
          <p className="text-sm font-semibold text-slate-900">{monthLabel(activeMonth)}</p>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
            onClick={() => {
              setActiveMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }}
            type="button"
          >
            Next
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <p className="text-center text-[11px] font-medium text-slate-500" key={label}>
              {label}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayIso = toIsoDate(day)
            const isInActiveMonth = day.getMonth() === activeMonth.getMonth()
            const sessionCount = dayToSessions.get(dayIso)?.length ?? 0
            const isSelected = selectedDate === dayIso
            const isToday = dayIso === toIsoDate(new Date())

            return (
              <button
                className={`min-h-12 rounded-md border px-1 py-2 text-center text-xs ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 text-slate-700'
                } ${!isInActiveMonth ? 'opacity-40' : ''}`}
                key={`${activeMonthKey}-${dayIso}`}
                onClick={() => {
                  setSelectedDate(dayIso)
                }}
                type="button"
              >
                <span className={`block ${isToday ? 'font-bold' : ''}`}>{day.getDate()}</span>
                {sessionCount > 0 && (
                  <span className="mt-1 inline-block rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {sessionCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {isLoadingMonth && <p className="mt-3 text-sm text-slate-600">Loading month...</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">{dayLabel(selectedDate)}</h2>
        {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}

        {isLoadingDetails && (
          <p className="mt-2 text-sm text-slate-600">Loading workout details...</p>
        )}

        {!isLoadingDetails && selectedDetails.length === 0 && (
          <p className="mt-2 text-sm text-slate-600">No workouts logged for this day.</p>
        )}

        {!isLoadingDetails && selectedDetails.length > 0 && (
          <div className="mt-3 space-y-3">
            {selectedDetails.map((session, sessionIndex) => (
              <article className="rounded-md border border-slate-200 p-3" key={session.id}>
                <p className="text-sm font-semibold text-slate-900">
                  Session {sessionIndex + 1}
                  {session.routineDayLabel ? ` - ${session.routineDayLabel}` : ''}
                </p>

                {session.exercises.length === 0 && (
                  <p className="mt-2 text-sm text-slate-600">No exercises in this session.</p>
                )}

                {session.exercises.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {session.exercises.map((exercise) => (
                      <li className="rounded border border-slate-200 p-2" key={exercise.id}>
                        <p className="text-sm font-medium text-slate-900">
                          {exercise.nameSnapshot}
                        </p>
                        {exercise.sets.length === 0 && (
                          <p className="text-xs text-slate-600">No sets logged.</p>
                        )}
                        {exercise.sets.length > 0 && (
                          <ul className="mt-1 space-y-1">
                            {exercise.sets.map((set) => (
                              <li className="text-xs text-slate-700" key={set.id}>
                                Set {set.order + 1}: {set.reps} reps x {set.weightKg} kg
                                {set.rpe !== undefined ? `, RPE ${set.rpe}` : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
