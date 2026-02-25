import { Link } from 'react-router-dom'

export const LogWorkoutPage = () => (
  <main className="mx-auto min-h-screen w-full max-w-2xl space-y-3 p-4">
    <h1 className="text-2xl font-semibold text-slate-900">Log Workout</h1>
    <p className="text-sm text-slate-600">Workout logging UI is not in this change.</p>
    <Link className="text-sm text-blue-700 underline" to="/module-select">
      Back
    </Link>
  </main>
)
