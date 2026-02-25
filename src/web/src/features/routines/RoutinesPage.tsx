import { Link } from 'react-router-dom'

export const RoutinesPage = () => (
  <main className="mx-auto min-h-screen w-full max-w-2xl space-y-3 p-4">
    <h1 className="text-2xl font-semibold text-slate-900">Routines</h1>
    <p className="text-sm text-slate-600">Routine management UI is not in this change.</p>
    <div className="flex gap-3 text-sm">
      <Link className="text-blue-700 underline" to="/module-select">
        Back
      </Link>
      <Link className="text-blue-700 underline" to="/routine-builder">
        Open builder placeholder
      </Link>
    </div>
  </main>
)
