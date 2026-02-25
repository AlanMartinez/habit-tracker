import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

type AppShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  withNav?: boolean
  onBack?: () => void
  rightAction?: ReactNode
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

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopBar
        onBack={onBack ?? (withNav ? undefined : () => navigate(-1))}
        rightAction={rightAction}
        subtitle={subtitle}
        title={title}
      />
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">{children}</main>
      {withNav && <BottomNav />}
    </div>
  )
}
