import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type BadgeTone = 'default' | 'active' | 'info' | 'success' | 'warning'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  default: 'bg-slate-100 text-slate-700',
  active: 'bg-teal-100 text-teal-700',
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
