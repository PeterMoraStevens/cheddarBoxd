export function ReviewCardSkeleton() {
  return (
    <div className="neo-card p-4 flex flex-col gap-3 animate-pulse">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[color:var(--muted)] shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-2.5 bg-[color:var(--muted)] w-1/3" />
          <div className="h-2 bg-[color:var(--muted)] w-1/4" />
        </div>
      </div>
      {/* Body block */}
      <div className="h-16 bg-[color:var(--muted)]" />
      {/* Short line */}
      <div className="h-2.5 bg-[color:var(--muted)] w-3/4" />
    </div>
  )
}

export function SnackCardSkeleton() {
  return (
    <div className="neo-card flex flex-col animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-square bg-[color:var(--muted)] border-b-2 border-[color:var(--border)]" />
      {/* Info block */}
      <div className="p-3 flex flex-col gap-2">
        <div className="h-2.5 bg-[color:var(--muted)] w-full" />
        <div className="h-2 bg-[color:var(--muted)] w-2/3" />
      </div>
    </div>
  )
}
