import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'

export const ModuleSelectPage = () => {
  const { signOut } = useAuth()

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-4 p-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Module Select</h1>
        <p className="text-sm text-slate-600">MVP currently supports only the Gym module.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-700">Gym module is active.</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link className="text-blue-700 underline" to="/exercises">
            Manage exercises
          </Link>
          <Link className="text-blue-700 underline" to="/routines">
            Manage routines
          </Link>
          <Link className="text-blue-700 underline" to="/history">
            View history
          </Link>
          <button
            className="rounded-md border border-slate-300 px-3 py-1 text-slate-700"
            onClick={() => {
              void signOut()
            }}
            type="button"
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  )
}
