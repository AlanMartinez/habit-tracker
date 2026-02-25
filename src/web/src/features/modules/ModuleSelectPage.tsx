import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell, Button, Card, Skeleton } from '../../shared/components'

export const ModuleSelectPage = () => {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading] = useState(false)

  const onContinue = () => {
    setIsSaving(true)
    window.setTimeout(() => {
      setIsSaving(false)
      navigate('/app/workout')
    }, 400)
  }

  return (
    <AppShell subtitle="Choose your module" title="Select module" withNav={false}>
      {isLoading ? (
        <Skeleton variant="card" />
      ) : (
        <Card className="space-y-3">
          <p className="text-sm font-semibold text-violet-950 dark:text-violet-100">GYM</p>
          <p className="text-sm text-violet-700 dark:text-violet-300">Strength and hypertrophy logging.</p>
          <Button className="w-full sm:w-auto" loading={isSaving} onClick={onContinue}>
            Continue
          </Button>
        </Card>
      )}
    </AppShell>
  )
}
