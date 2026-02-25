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
    'bg-violet-600 text-white hover:bg-violet-500 focus-visible:outline-violet-500 disabled:bg-violet-300 dark:disabled:bg-violet-800 disabled:text-violet-700 dark:disabled:text-violet-300',
  secondary:
    'border border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-900/50 text-violet-900 dark:text-violet-100 hover:bg-violet-100 dark:hover:bg-violet-900/70 focus-visible:outline-violet-500 disabled:text-violet-400 dark:disabled:text-violet-500',
  ghost:
    'bg-transparent text-violet-800 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900/70 focus-visible:outline-violet-500 disabled:text-violet-400 dark:disabled:text-violet-500',
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
