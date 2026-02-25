import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type BadgeTone = 'default' | 'active' | 'info' | 'success' | 'warning'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  default: 'bg-violet-100 dark:bg-violet-900/70 text-violet-800 dark:text-violet-200',
  active: 'bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
}

export const Badge = ({ tone = 'default', className, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
      toneClasses[tone],
      className,
    )}
    {...props}
  />
)
