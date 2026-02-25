import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type BadgeTone = 'default' | 'active' | 'info' | 'success' | 'warning'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  default: 'bg-[var(--surface-2)] text-[var(--text)]',
  active: 'bg-[var(--accent-soft)] text-[var(--accent-text)]',
  info: 'bg-sky-100 text-sky-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
}

export const Badge = ({ tone = 'default', className, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border border-[var(--border-muted)] px-2.5 py-1 text-xs font-semibold',
      toneClasses[tone],
      className,
    )}
    {...props}
  />
)
