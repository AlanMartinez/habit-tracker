import { useMemo, useState } from 'react'
import { AppShell, Button, Card, Drawer, EmptyState, Skeleton } from '../../shared/components'

const weekdayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const monthCells = Array.from({ length: 35 }, (_, index) => {
  const day = index + 1
  return {
    label: day <= 29 ? String(day) : '',
    hasWorkout: [2, 6, 10, 14, 19, 25].includes(day),
  }
})

export const HistoryPage = () => {
  const [isLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const selectedLabel = useMemo(() => {
    if (!selectedDay) {
      return ''
    }

    return `Feb ${selectedDay}, 2026`
  }, [selectedDay])

  return (
    <AppShell title="History">
      {isLoading && <Skeleton variant="calendar" />}

      {!isLoading && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <Button size="sm" variant="ghost">
              Prev
            </Button>
            <h2 className="text-lg font-semibold text-slate-900">Feb 2026</h2>
            <Button size="sm" variant="ghost">
              Next
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((cell, index) => (
              <button
                className="min-h-11 rounded-lg border border-slate-200 p-1 text-sm text-slate-700 disabled:border-transparent disabled:bg-transparent"
                disabled={cell.label.length === 0}
                key={`${cell.label}-${index}`}
                onClick={() => {
                  if (cell.hasWorkout) {
                    setSelectedDay(cell.label)
                  }
                }}
                type="button"
              >
                <span className="block">{cell.label}</span>
                {cell.hasWorkout && <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-teal-600" />}
              </button>
            ))}
          </div>
        </Card>
      )}

      {!isLoading && (
        <EmptyState
          description="Tap a marked day to view workout details."
          title="Calendar placeholder"
        />
      )}

      <Drawer onClose={() => setSelectedDay(null)} open={Boolean(selectedDay)} title={selectedLabel || 'Workout Detail'}>
        <div className="space-y-3">
          <p className="text-sm text-slate-700">Pull - PPL V1</p>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">Lat Pulldown</p>
            <p className="text-xs text-slate-600">10x55, 8x60</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">Seated Row</p>
            <p className="text-xs text-slate-600">12x45, 10x50</p>
          </div>
        </div>
      </Drawer>
    </AppShell>
  )
}
