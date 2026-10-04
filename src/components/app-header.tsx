import type { ReactNode } from 'react'

type AppHeaderProps = {
  children: ReactNode
  leading?: ReactNode
  showBrand?: boolean
  className?: string
}

export function BrandLockup() {
  return (
    <div className="brand-lockup">
      <span className="brand-mark">R</span>
      <div>
        <p className="brand-name">ResuMe</p>
        <p className="brand-caption">Your work, in your words.</p>
      </div>
    </div>
  )
}

export function AppHeader({
  children,
  leading,
  showBrand = true,
  className = '',
}: AppHeaderProps) {
  return (
    <header className={`app-header${className ? ` ${className}` : ''}`}>
      <div className="app-header-left">
        {leading}
        {showBrand ? <BrandLockup /> : null}
      </div>
      <div className="header-actions">{children}</div>
    </header>
  )
}
