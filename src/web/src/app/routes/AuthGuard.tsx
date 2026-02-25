import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

export const AuthGuard = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-8 text-sm text-slate-600">Checking authentication...</div>
  }

  if (!user) {
    return <Navigate replace to="/login" />
  }

  return <Outlet />
}
