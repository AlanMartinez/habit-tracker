import type { SelectHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import type { FieldOption } from '../types/ui'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  helperText?: string
  error?: string
  options: FieldOption[]
}

export const Select = ({
  id,
  label,
  helperText,
  error,
  options,
  className,
  ...props
}: SelectProps) => {
  const describedBy = error ? `${id}-error` : helperText ? `${id}-help` : undefined

  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-violet-800 dark:text-violet-200">{label}</span>
      <select
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-11 w-full rounded-lg border bg-violet-50/80 dark:bg-violet-900/50 px-3 py-2 text-sm text-violet-950 dark:text-violet-100 outline-none transition focus-visible:ring-2 focus-visible:ring-violet-500/30',
          error ? 'border-red-500 focus-visible:border-red-500' : 'border-violet-200 dark:border-violet-800 focus-visible:border-violet-500',
          className,
        )}
        id={id}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p className="text-xs text-violet-500 dark:text-violet-400" id={`${id}-help`}>
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
