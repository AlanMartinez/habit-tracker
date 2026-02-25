import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  helperText?: string
  error?: string
}

export const Textarea = ({ id, label, helperText, error, className, ...props }: TextareaProps) => {
  const describedBy = error ? `${id}-error` : helperText ? `${id}-help` : undefined

  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
      <textarea
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-24 w-full rounded-2xl border bg-[var(--surface-1)] px-3.5 py-2 text-sm text-[var(--text-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition placeholder:text-[var(--text-muted)] focus-visible:ring-3 focus-visible:ring-[color:var(--accent-soft)]',
          error
            ? 'border-red-500 focus-visible:border-red-500'
            : 'border-[var(--border)] focus-visible:border-[var(--accent)]',
          className,
        )}
        id={id}
        {...props}
      />
      {helperText && !error && (
        <p className="text-xs text-[var(--text-muted)]" id={`${id}-help`}>
          {helperText}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </label>
  )
}
