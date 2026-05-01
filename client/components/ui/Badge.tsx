interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'muted'
  className?: string
}

const variants = {
  default: 'bg-[color:var(--surface)] border-[color:var(--border)] text-[color:var(--text)]',
  primary: 'bg-primary border-ink text-ink',
  muted: 'bg-[color:var(--muted)] border-[color:var(--border)] text-[color:var(--text-muted)]',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wide border-2
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  )
}
