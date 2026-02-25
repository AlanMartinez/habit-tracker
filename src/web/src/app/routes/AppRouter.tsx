import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'
import { LoginPage } from '../../features/auth/LoginPage'
import { ExercisesPage } from '../../features/exercises/ExercisesPage'
import { HistoryPage } from '../../features/history/HistoryPage'
import { ModuleSelectPage } from '../../features/modules/ModuleSelectPage'
import { RoutineBuilderPage } from '../../features/routines/RoutineBuilderPage'
import { RoutinesPage } from '../../features/routines/RoutinesPage'
import { LogWorkoutPage } from '../../features/workout/LogWorkoutPage'
import { AuthGuard } from './AuthGuard'
import { PublicOnlyGuard } from './PublicOnlyGuard'

const RootRedirect = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-8 text-sm text-slate-600">Loading...</div>
  }

  return <Navigate replace to={user ? '/module-select' : '/login'} />
}

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyGuard />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<AuthGuard />}>
        <Route path="/module-select" element={<ModuleSelectPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/routine-builder" element={<RoutineBuilderPage />} />
        <Route path="/routine-builder/:routineId" element={<RoutineBuilderPage />} />
        <Route path="/log-workout" element={<LogWorkoutPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  </BrowserRouter>
)
