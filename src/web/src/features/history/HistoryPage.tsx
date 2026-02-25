import { Link } from 'react-router-dom'

export const HistoryPage = () => (
  <main className="mx-auto min-h-screen w-full max-w-2xl space-y-3 p-4">
    <h1 className="text-2xl font-semibold text-slate-900">History</h1>
    <p className="text-sm text-slate-600">Workout history UI is not in this change.</p>
    <Link className="text-sm text-blue-700 underline" to="/module-select">
      Back
    </Link>
  </main>
)
