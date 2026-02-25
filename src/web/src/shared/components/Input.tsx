import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  helperText?: string
  error?: string
}

export const Input = ({ id, label, helperText, error, className, ...props }: InputProps) => {
  const describedBy = error ? `${id}-error` : helperText ? `${id}-help` : undefined

  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500/30',
          error ? 'border-red-500 focus-visible:border-red-500' : 'border-slate-200 focus-visible:border-teal-600',
          className,
        )}
        id={id}
        {...props}
      />
      {helperText && !error && (
        <p className="text-xs text-slate-500" id={`${id}-help`}>
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
