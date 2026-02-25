import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
} from '../../shared/components'

type RoutineItem = {
  id: string
  name: string
  type: 'AB' | 'PPL'
  active: boolean
}

const defaultRoutines: RoutineItem[] = [
  { id: 'r1', name: 'PPL - V1', type: 'PPL', active: true },
  { id: 'r2', name: 'A/B - Home', type: 'AB', active: false },
]

export const RoutinesPage = () => {
  const [items, setItems] = useState<RoutineItem[]>(defaultRoutines)
  const [open, setOpen] = useState(false)
  const [isLoading] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'AB' | 'PPL'>('AB')

  const createRoutine = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }

    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: trimmed, type, active: false },
    ])
    setName('')
    setType('AB')
    setOpen(false)
  }

  const setActive = (id: string) => {
    setItems((prev) => prev.map((item) => ({ ...item, active: item.id === id })))
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
      {isLoading && <Skeleton variant="card" />}

      {!isLoading && items.length === 0 && (
        <EmptyState
          action={<Button onClick={() => setOpen(true)}>Create routine</Button>}
          description="Set up a training split to auto-populate workout logging."
          title="No routines yet"
        />
      )}

      {!isLoading && items.length > 0 && (
        <Card className="space-y-3">
          {items.map((item) => (
            <article className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0" key={item.id}>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-900">{item.name}</h2>
                <div className="flex items-center gap-2">
                  <Badge tone="info">{item.type}</Badge>
                  {item.active && <Badge tone="active">Active</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                {!item.active && (
                  <Button onClick={() => setActive(item.id)} size="sm" variant="ghost">
                    Set Active
                  </Button>
                )}
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  to={`/app/routines/${item.id}`}
                >
                  Open
                </Link>
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
            <Button onClick={createRoutine}>Create</Button>
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
        <Select
          id="routine-type"
          label="Type"
          onChange={(event) => setType(event.target.value as 'AB' | 'PPL')}
          options={[
            { label: 'AB', value: 'AB' },
            { label: 'PPL', value: 'PPL' },
          ]}
          value={type}
        />
      </Modal>
    </AppShell>
  )
}
