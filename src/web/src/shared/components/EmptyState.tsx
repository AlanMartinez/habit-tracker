import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="rounded-2xl border border-dashed border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950 p-6 text-center">
    <h3 className="text-lg font-semibold text-violet-950 dark:text-violet-100">{title}</h3>
    <p className="mt-1 text-sm text-violet-700 dark:text-violet-300">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
)
