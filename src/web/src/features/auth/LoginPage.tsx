import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../../shared/components'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error] = useState<string | null>(null)

  const onContinue = () => {
    setIsLoading(true)

    window.setTimeout(() => {
      setIsLoading(false)
      navigate('/app/modules')
    }, 500)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <Card className="w-full space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-violet-950 dark:text-violet-100">HabitTracker</h1>
          <p className="text-sm text-violet-700 dark:text-violet-300">Train. Log. Improve.</p>
        </div>
        <Button className="w-full" loading={isLoading} onClick={onContinue} size="lg">
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Button>
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <p className="text-center text-xs text-violet-500 dark:text-violet-400">Secure sign-in</p>
      </Card>
    </main>
  )
}
