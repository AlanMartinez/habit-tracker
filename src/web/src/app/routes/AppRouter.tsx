import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../features/auth/LoginPage'
import { ExercisesPage } from '../../features/exercises/ExercisesPage'
import { HistoryPage } from '../../features/history/HistoryPage'
import { ModuleSelectPage } from '../../features/modules/ModuleSelectPage'
import { RoutineBuilderPage } from '../../features/routines/RoutineBuilderPage'
import { RoutinesPage } from '../../features/routines/RoutinesPage'
import { LogWorkoutPage } from '../../features/workout/LogWorkoutPage'

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Navigate replace to="/login" />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ModuleSelectPage />} path="/app/modules" />
      <Route element={<LogWorkoutPage />} path="/app/workout" />
      <Route element={<ExercisesPage />} path="/app/exercises" />
      <Route element={<RoutinesPage />} path="/app/routines" />
      <Route element={<RoutineBuilderPage />} path="/app/routines/:routineId" />
      <Route element={<HistoryPage />} path="/app/history" />
      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  </BrowserRouter>
)
