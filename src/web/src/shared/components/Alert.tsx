import { cn } from '../lib/cn'
import type { ReactNode } from 'react'

type AlertTone = 'error' | 'warning' | 'info'

type AlertProps = {
  tone?: AlertTone
  children: ReactNode
  onDismiss?: () => void
  className?: string
}

const toneClasses: Record<AlertTone, string> = {
  error: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  warning: 'border-amber-300 bg-amber-50 text-amber-700',
  info: 'border-sky-300 bg-sky-50 text-sky-700',
}

export const Alert = ({ tone = 'error', children, onDismiss, className }: AlertProps) => (
  <div
    className={cn(
      'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium',
      toneClasses[tone],
      className,
    )}
    role="alert"
  >
    <span className="flex-1">{children}</span>
    {onDismiss && (
      <button
        aria-label="Dismiss"
        className="shrink-0 opacity-60 hover:opacity-100"
        onClick={onDismiss}
        type="button"
      >
        ✕
      </button>
    )}
  </div>
)
