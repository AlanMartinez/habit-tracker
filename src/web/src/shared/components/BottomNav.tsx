import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import type { BottomNavItem } from '../types/ui'

const defaultItems: BottomNavItem[] = [
  { key: 'workout', label: 'Workout', to: '/app/workout' },
  { key: 'exercises', label: 'Exercises', to: '/app/exercises' },
  { key: 'routines', label: 'Routines', to: '/app/routines' },
  { key: 'history', label: 'History', to: '/app/history' },
]

type BottomNavProps = {
  items?: BottomNavItem[]
}

export const BottomNav = ({ items = defaultItems }: BottomNavProps) => (
  <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[color:var(--surface-1)]/95 px-2 pb-2 pt-2 backdrop-blur md:left-1/2 md:max-w-3xl md:-translate-x-1/2 md:rounded-t-2xl md:border md:shadow-[var(--card-shadow)]">
    <ul className="grid grid-cols-4 gap-1">
      {items.map((item) => (
        <li key={item.key}>
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-medium transition',
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
              )
            }
            to={item.to}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
)
