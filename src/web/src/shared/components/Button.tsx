import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { ButtonSize, ButtonVariant } from '../types/ui'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leadingIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 focus-visible:outline-teal-600 disabled:bg-slate-300 disabled:text-slate-600',
  secondary:
    'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-slate-500 disabled:text-slate-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500 disabled:text-slate-400',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export const Button = ({
  className,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      className,
    )}
    disabled={disabled || loading}
    type={type}
    {...props}
  >
    {loading ? (
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      />
    ) : (
      leadingIcon
    )}
    <span>{children}</span>
  </button>
)
