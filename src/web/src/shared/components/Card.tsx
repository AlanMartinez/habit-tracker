import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--card-shadow)] backdrop-blur-md',
      className,
    )}
    {...props}
  />
)
