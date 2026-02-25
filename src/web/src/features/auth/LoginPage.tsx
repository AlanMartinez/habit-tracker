import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Button, Card } from '../../shared/components'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onContinue = async () => {
    if (isLoading) {
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      await signInWithGoogle()
      navigate('/app/modules')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to sign in with Google.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <Card className="w-full space-y-5 p-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Welcome Back
          </p>
          <h1 className="text-3xl font-bold text-[var(--text-strong)]">HabitTracker</h1>
          <p className="text-sm text-[var(--text-muted)]">Train with structure, log with clarity.</p>
        </div>
        <Button className="w-full" loading={isLoading} onClick={onContinue} size="lg">
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Button>
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <p className="text-center text-xs text-[var(--text-muted)]">Secure sign-in</p>
      </Card>
    </main>
  )
}
