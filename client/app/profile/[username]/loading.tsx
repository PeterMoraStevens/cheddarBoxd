import { ReviewCardSkeleton } from '@/components/ui/Skeleton'

export default function ProfileLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero section skeleton */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Left: avatar */}
        <div className="flex justify-center md:justify-start">
          <div className="w-32 h-32 rounded-full bg-[color:var(--muted)] animate-pulse" />
        </div>
        {/* Right: text lines */}
        <div className="md:col-span-2 flex flex-col gap-3 animate-pulse">
          <div className="h-8 bg-[color:var(--muted)] w-48" />
          <div className="h-4 bg-[color:var(--muted)] w-32" />
          <div className="h-3 bg-[color:var(--muted)] w-full max-w-sm" />
          <div className="h-3 bg-[color:var(--muted)] w-3/4 max-w-xs" />
          <div className="flex gap-4 mt-2">
            <div className="h-6 bg-[color:var(--muted)] w-20" />
            <div className="h-6 bg-[color:var(--muted)] w-20" />
            <div className="h-6 bg-[color:var(--muted)] w-20" />
          </div>
        </div>
      </div>

      {/* Section heading skeleton */}
      <div className="h-8 bg-[color:var(--muted)] w-40 mb-6 animate-pulse" />

      {/* Reviews grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
