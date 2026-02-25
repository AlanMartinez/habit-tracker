import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/useAuth'
import type { Routine, WithId } from '../../shared/types/firestore'
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Skeleton,
} from '../../shared/components'
import {
  createRoutine,
  deleteRoutine,
  listRoutines,
  setActiveRoutine,
  type DaysPerWeek,
} from './routines.data'

export const RoutinesPage = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<Array<WithId<Routine>>>([])
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState<DaysPerWeek>(3)

  const refreshRoutines = async () => {
    if (!user) {
      setItems([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const nextItems = await listRoutines(user.uid)
      setItems(nextItems)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load routines.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshRoutines()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const onCreateRoutine = async () => {
    if (!user) {
      return
    }

    const trimmed = name.trim()
    if (!trimmed) {
      return
    }

    try {
      setError(null)
      await createRoutine(user.uid, { name: trimmed, daysPerWeek })
      setName('')
      setDaysPerWeek(3)
      setOpen(false)
      await refreshRoutines()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to create routine.')
    }
  }

  const onSetActive = async (id: string) => {
    if (!user) {
      return
    }

    try {
      setError(null)
      await setActiveRoutine(user.uid, items, id)
      await refreshRoutines()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to set active routine.')
    }
  }

  const onDelete = async (routine: WithId<Routine>) => {
    if (!user) {
      return
    }

    try {
      setError(null)
      await deleteRoutine(user.uid, routine)
      await refreshRoutines()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete routine.')
    }
  }

  return (
    <AppShell
      rightAction={
        <Button onClick={() => setOpen(true)} size="sm">
          Add
        </Button>
      }
      title="Routines"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      {isLoading && <Skeleton variant="card" />}

      {!isLoading && items.length === 0 && (
        <EmptyState
          action={<Button onClick={() => setOpen(true)}>Create routine</Button>}
          description="Set up your weekly structure and map exercises per day."
          title="No routines yet"
        />
      )}

      {!isLoading && items.length > 0 && (
        <Card className="space-y-3">
          {items.map((item) => (
            <article
              className="flex items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3 last:border-b-0 last:pb-0"
              key={item.id}
            >
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-[var(--text-strong)]">{item.name}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">{item.daysPerWeek ?? item.dayOrder.length} days/week</Badge>
                  {item.isActive && <Badge tone="active">Active</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {!item.isActive && (
                  <Button onClick={() => void onSetActive(item.id)} size="sm" variant="ghost">
                    Set active
                  </Button>
                )}
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm font-semibold text-[var(--text)] transition hover:opacity-90"
                  to={`/app/routines/${item.id}`}
                >
                  Open
                </Link>
                <Button onClick={() => void onDelete(item)} size="sm" variant="secondary">
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
            <Button onClick={() => void onCreateRoutine()}>Create</Button>
          </div>
        }
        onClose={() => setOpen(false)}
        open={open}
        title="New Routine"
      >
        <Input
          id="routine-name"
          label="Name"
          onChange={(event) => setName(event.target.value)}
          placeholder="Routine name"
          value={name}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text)]">Days per week</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => setDaysPerWeek(3)}
              variant={daysPerWeek === 3 ? 'primary' : 'secondary'}
            >
              3
            </Button>
            <Button
              onClick={() => setDaysPerWeek(4)}
              variant={daysPerWeek === 4 ? 'primary' : 'secondary'}
            >
              4
            </Button>
            <Button
              onClick={() => setDaysPerWeek(5)}
              variant={daysPerWeek === 5 ? 'primary' : 'secondary'}
            >
              5
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
