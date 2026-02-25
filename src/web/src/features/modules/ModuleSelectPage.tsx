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
          <p className="text-sm font-semibold text-slate-900">GYM</p>
          <p className="text-sm text-slate-600">Strength and hypertrophy logging.</p>
          <Button className="w-full sm:w-auto" loading={isSaving} onClick={onContinue}>
            Continue
          </Button>
        </Card>
      )}
    </AppShell>
  )
}
