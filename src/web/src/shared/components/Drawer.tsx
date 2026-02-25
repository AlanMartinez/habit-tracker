import { useEffect, type ReactNode } from 'react'
import { Button } from './Button'

type DrawerProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export const Drawer = ({ open, title, onClose, children }: DrawerProps) => {
  useEffect(() => {
    if (!open) {
      return
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 bg-violet-950/70" onClick={onClose}>
      <div
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-violet-50/80 dark:bg-violet-900/50 shadow-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-900/50 px-4 py-3">
          <h2 className="text-lg font-semibold text-violet-950 dark:text-violet-100">{title}</h2>
          <Button aria-label="Close" onClick={onClose} size="sm" variant="ghost">
            Close
          </Button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
