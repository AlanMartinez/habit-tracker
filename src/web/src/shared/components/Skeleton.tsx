import { cn } from '../lib/cn'

type SkeletonVariant = 'row' | 'card' | 'calendar'

type SkeletonProps = {
  variant?: SkeletonVariant
  className?: string
}

const variantClasses: Record<SkeletonVariant, string> = {
  row: 'h-12 rounded-lg',
  card: 'h-24 rounded-2xl',
  calendar: 'h-56 rounded-2xl',
}

export const Skeleton = ({ variant = 'row', className }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={cn('animate-pulse bg-[var(--surface-3)]', variantClasses[variant], className)}
  />
)
