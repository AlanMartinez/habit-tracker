import { useEffect, type ReactNode } from 'react'
import { Button } from './Button'
import { cn } from '../lib/cn'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export const Modal = ({ open, title, onClose, children, footer, className }: ModalProps) => {
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
    <div className="fixed inset-0 z-40 flex items-end bg-black/50 p-4 md:items-center md:justify-center">
      <div
        aria-modal="true"
        className={cn(
          'w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--card-shadow)]',
          className,
        )}
        role="dialog"
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-lg font-semibold text-[var(--text-strong)]">{title}</h2>
          <Button aria-label="Close" onClick={onClose} size="sm" variant="ghost">
            Close
          </Button>
        </header>
        <div className="space-y-3 p-4">{children}</div>
        {footer && <footer className="border-t border-[var(--border)] p-4">{footer}</footer>}
      </div>
    </div>
  )
}
