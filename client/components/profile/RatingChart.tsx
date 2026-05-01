interface RatingChartProps {
  ratings: (number | null)[]
  compact?: boolean
}

const STARS = [5, 4, 3, 2, 1] as const

export function RatingChart({ ratings, compact = false }: RatingChartProps) {
  const rated = ratings.filter((r): r is number => r != null)
  const total = rated.length

  if (total === 0) return null

  const counts = STARS.map((star) => ({
    star,
    count: rated.filter((r) => Math.round(r) === star).length,
  }))

  const max = Math.max(...counts.map((c) => c.count), 1)

  if (compact) {
    return (
      <div className="flex flex-col gap-1 min-w-[140px]">
        {counts.map(({ star, count }) => {
          const pct = (count / max) * 100
          return (
            <div key={star} className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold w-3 text-right text-[color:var(--text-muted)]">{star}</span>
              <span className="text-primary text-[10px] leading-none">★</span>
              <div className="flex-1 h-2.5 bg-[color:var(--muted)] border border-[color:var(--border)] overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] text-[color:var(--text-muted)] w-3 text-right tabular-nums">
                {count > 0 ? count : ''}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="neo-card p-4">
      <h3 className="text-xs font-black uppercase tracking-widest mb-3 text-[color:var(--text-muted)]">
        Rating distribution
      </h3>
      <div className="flex flex-col gap-1.5">
        {counts.map(({ star, count }) => {
          const pct = (count / max) * 100
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs font-bold w-4 text-right text-[color:var(--text-muted)]">{star}</span>
              <span className="text-primary text-xs leading-none">★</span>
              <div className="flex-1 h-4 bg-[color:var(--muted)] border border-[color:var(--border)] overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-[color:var(--text-muted)] w-5 text-right tabular-nums">
                {count > 0 ? count : ''}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-[color:var(--text-muted)]">
        {total} rated review{total !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
