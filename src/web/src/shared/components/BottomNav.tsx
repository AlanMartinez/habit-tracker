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
  <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-900/50 px-2 pb-2 pt-2 md:left-1/2 md:max-w-3xl md:-translate-x-1/2 md:rounded-t-2xl md:border md:shadow-lg">
    <ul className="grid grid-cols-4 gap-1">
      {items.map((item) => (
        <li key={item.key}>
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-medium transition',
                isActive ? 'bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200' : 'text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/70',
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
