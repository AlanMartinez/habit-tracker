import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
    <h3 className="text-lg font-semibold text-[var(--text-strong)]">{title}</h3>
    <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
)
