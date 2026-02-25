import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn('rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--card-shadow)]', className)}
    {...props}
  />
)
