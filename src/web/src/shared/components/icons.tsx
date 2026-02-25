import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
  viewBox: '0 0 24 24',
}

export const IconChevronLeft = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const IconMoon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M21 12.7A9 9 0 1 1 11.3 3a7 7 0 1 0 9.7 9.7Z" />
  </svg>
)

export const IconSun = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </svg>
)

export const IconSparkles = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="m12 3 1.2 3.1L16 7.3l-2.8 1.2L12 12l-1.2-3.5L8 7.3l2.8-1.2z" />
    <path d="m5 14 .7 1.8 1.8.7-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7z" />
    <path d="m19 13 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </svg>
)

export const IconDumbbell = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M4 10v4M7 9v6M17 9v6M20 10v4" />
    <path d="M7 12h10" />
  </svg>
)

export const IconLibrary = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M4 5h5v14H4zM10 5h5v14h-5zM16 5h4v14h-4z" />
  </svg>
)

export const IconChecklist = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M9 7h10M9 12h10M9 17h10" />
    <path d="m4 7 1.2 1.2L7.5 6M4 12l1.2 1.2L7.5 11M4 17l1.2 1.2L7.5 16" />
  </svg>
)

export const IconChart = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M4 20V8M10 20V4M16 20v-7M22 20V11" />
  </svg>
)
