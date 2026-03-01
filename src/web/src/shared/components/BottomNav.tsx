import type { ComponentType, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import type { BottomNavItem, BottomNavKey } from '../types/ui'
import { IconChart, IconChecklist, IconDumbbell, IconLibrary } from './icons'

const defaultItems: BottomNavItem[] = [
  { key: 'workout', label: 'Workout', to: '/app/workout' },
  { key: 'exercises', label: 'Exercises', to: '/app/exercises' },
  { key: 'routines', label: 'Routines', to: '/app/routines' },
  { key: 'history', label: 'History', to: '/app/history' },
]

const navIcons: Record<BottomNavKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  workout: IconDumbbell,
  exercises: IconLibrary,
  routines: IconChecklist,
  history: IconChart,
}

type BottomNavProps = {
  items?: BottomNavItem[]
}

export const BottomNav = ({ items = defaultItems }: BottomNavProps) => (
  <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[color:var(--surface-1)]/95 px-2 pb-2 pt-2 backdrop-blur-xl md:left-1/2 md:max-w-3xl md:-translate-x-1/2 md:rounded-t-3xl md:border md:shadow-[var(--card-shadow)]">
    <ul className="grid grid-cols-4 gap-1">
      {items.map((item) => {
        const Icon = navIcons[item.key]

        return (
          <li key={item.key}>
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] scale-[1.04]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
                )
              }
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('transition-all duration-150', isActive ? 'h-5 w-5' : 'h-4 w-4')} />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        )
      })}
    </ul>
  </nav>
)
