import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

export const PublicOnlyGuard = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-8 text-sm text-violet-700 dark:text-violet-300">Checking authentication...</div>
  }

  if (user) {
    return <Navigate replace to="/app/modules" />
  }

  return <Outlet />
}
