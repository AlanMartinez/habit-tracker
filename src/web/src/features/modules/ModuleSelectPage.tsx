import { useNavigate } from 'react-router-dom'
import { AppShell, Badge, Button, Card } from '../../shared/components'

export const ModuleSelectPage = () => {
  const navigate = useNavigate()

  return (
    <AppShell subtitle="Your daily training cockpit" title="HabitTracker" withNav={false}>
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[radial-gradient(circle_at_top_right,var(--surface-accent),transparent_55%),var(--surface-1)] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Start Strong</p>
        <h2 className="mt-2 text-3xl font-bold text-[var(--text-strong)]">Build momentum today</h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
          Plan your routine, launch the session, and log every set with a clear flow.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="active">Workout first</Badge>
          <Badge tone="info">Routine-driven</Badge>
        </div>
        <Button className="mt-6 w-full sm:w-auto" onClick={() => navigate('/app/workout')} size="lg">
          Open dashboard
        </Button>
      </section>

      <Card className="space-y-2">
        <h3 className="text-base font-semibold text-[var(--text-strong)]">Daily flow</h3>
        <p className="text-sm text-[var(--text-muted)]">1. Set active routine</p>
        <p className="text-sm text-[var(--text-muted)]">2. Press Start workout</p>
        <p className="text-sm text-[var(--text-muted)]">3. Log sets and finish</p>
      </Card>
    </AppShell>
  )
}
