import type { ReactNode } from 'react'
import { Button } from './Button'
import { IconChevronLeft } from './icons'

type TopBarProps = {
  title: string
  subtitle?: string
  onBack?: () => void
  rightAction?: ReactNode
}

export const TopBar = ({ title, subtitle, onBack, rightAction }: TopBarProps) => (
  <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:var(--surface-1)]/90 px-4 py-3 backdrop-blur-xl">
    <div className="mx-auto flex w-full max-w-3xl items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {onBack && (
          <Button aria-label="Go back" leadingIcon={<IconChevronLeft className="h-4 w-4" />} onClick={onBack} size="sm" variant="ghost">
            Back
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-strong)]">{title}</h1>
          {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {rightAction}
    </div>
  </header>
)
