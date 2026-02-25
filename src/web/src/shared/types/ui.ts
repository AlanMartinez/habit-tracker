export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type BottomNavKey = 'workout' | 'exercises' | 'routines' | 'history'

export type BottomNavItem = {
  key: BottomNavKey
  label: string
  to: string
}

export type FieldOption = {
  label: string
  value: string
}
