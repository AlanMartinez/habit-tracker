import type { ReactNode } from 'react'
import { Button } from './Button'

type TopBarProps = {
  title: string
  subtitle?: string
  onBack?: () => void
  rightAction?: ReactNode
}

export const TopBar = ({ title, subtitle, onBack, rightAction }: TopBarProps) => (
  <header className="sticky top-0 z-20 border-b border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/95 px-4 py-3 backdrop-blur">
    <div className="mx-auto flex w-full max-w-3xl items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {onBack && (
          <Button aria-label="Go back" onClick={onBack} size="sm" variant="ghost">
            Back
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-violet-950 dark:text-violet-100">{title}</h1>
          {subtitle && <p className="text-xs text-violet-500 dark:text-violet-400">{subtitle}</p>}
        </div>
      </div>
      {rightAction}
    </div>
  </header>
)
