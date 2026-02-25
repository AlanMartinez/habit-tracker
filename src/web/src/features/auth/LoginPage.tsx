import { Navigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'

export const LoginPage = () => {
  const { isLoading, signInWithGoogle, user } = useAuth()

  if (user) {
    return <Navigate replace to="/module-select" />
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Gym Habits Tracker</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in with Google to continue.</p>
        <button
          className="mt-4 w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isLoading}
          onClick={() => {
            void signInWithGoogle()
          }}
          type="button"
        >
          Continue with Google
        </button>
      </section>
    </main>
  )
}
