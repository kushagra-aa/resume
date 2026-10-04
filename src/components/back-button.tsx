import { ArrowLeft } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type BackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: 'primary' | 'secondary'
}

export function BackButton({
  label,
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: BackButtonProps) {
  return (
    <button
      {...props}
      className={`button button-${variant} back-button${className ? ` ${className}` : ''}`}
      type={type}
    >
      <ArrowLeft size={15} aria-hidden="true" />
      {label}
    </button>
  )
}
