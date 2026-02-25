import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../features/auth/LoginPage'
import { ExercisesPage } from '../../features/exercises/ExercisesPage'
import { HistoryPage } from '../../features/history/HistoryPage'
import { ModuleSelectPage } from '../../features/modules/ModuleSelectPage'
import { RoutineBuilderPage } from '../../features/routines/RoutineBuilderPage'
import { RoutinesPage } from '../../features/routines/RoutinesPage'
import { LogWorkoutPage } from '../../features/workout/LogWorkoutPage'
import { WorkoutDashboardPage } from '../../features/workout/WorkoutDashboardPage'
import { AuthGuard } from './AuthGuard'
import { PublicOnlyGuard } from './PublicOnlyGuard'

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Navigate replace to="/app/modules" />} path="/" />
      <Route element={<PublicOnlyGuard />}>
        <Route element={<LoginPage />} path="/login" />
      </Route>
      <Route element={<AuthGuard />}>
        <Route element={<ModuleSelectPage />} path="/app/modules" />
        <Route element={<WorkoutDashboardPage />} path="/app/workout" />
        <Route element={<LogWorkoutPage />} path="/app/workout/log" />
        <Route element={<ExercisesPage />} path="/app/exercises" />
        <Route element={<RoutinesPage />} path="/app/routines" />
        <Route element={<RoutineBuilderPage />} path="/app/routines/:routineId" />
        <Route element={<HistoryPage />} path="/app/history" />
      </Route>
      <Route element={<Navigate replace to="/app/modules" />} path="*" />
    </Routes>
  </BrowserRouter>
)
