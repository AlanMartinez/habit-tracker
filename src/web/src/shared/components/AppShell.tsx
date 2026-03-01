import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { Button } from './Button'
import { TopBar } from './TopBar'
import { IconMoon, IconSun } from './icons'

type AppShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  withNav?: boolean
  onBack?: () => void
  rightAction?: ReactNode
}

type ThemeName = 'light' | 'dark'

const THEME_KEY = 'habit-tracker.theme'

const getInitialTheme = (): ThemeName => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const AppShell = ({
  title,
  subtitle,
  children,
  withNav = true,
  onBack,
  rightAction,
}: AppShellProps) => {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<ThemeName>(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return (
    <div className="min-h-screen bg-[var(--surface-0)] pb-24">
      <TopBar
        onBack={onBack ?? (withNav ? undefined : () => navigate(-1))}
        rightAction={
          <div className="flex items-center gap-2">
            {rightAction}
            <Button
              leadingIcon={theme === 'light' ? <IconMoon className="h-4 w-4" /> : <IconSun className="h-4 w-4" />}
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              size="sm"
              variant="secondary"
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </Button>
          </div>
        }
        subtitle={subtitle}
        title={title}
      />
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        {children}
      </main>
      {withNav && <BottomNav />}
    </div>
  )
}
