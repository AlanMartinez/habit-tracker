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
    'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_10px_24px_rgba(153,99,239,0.32)] hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] focus-visible:outline-[var(--accent)] disabled:bg-[var(--surface-3)] disabled:text-[var(--text-muted)] disabled:shadow-none',
  secondary:
    'border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:-translate-y-0.5 hover:bg-[var(--surface-2)] focus-visible:outline-[var(--border-strong)] disabled:text-[var(--text-muted)]',
  ghost:
    'bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-[var(--border-strong)] disabled:text-[var(--text-muted)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-3.5 text-sm',
  md: 'h-11 px-4.5 text-sm',
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
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed',
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
