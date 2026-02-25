import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-600">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
)
