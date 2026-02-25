import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn('rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-900/50 p-4 shadow-sm', className)}
    {...props}
  />
)
