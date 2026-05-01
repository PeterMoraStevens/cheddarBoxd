import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReviewCardSkeleton } from '@/components/ui/Skeleton'
import { FeedContent } from './FeedContent'

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="h-8 bg-[color:var(--muted)] w-40 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ReviewCardSkeleton key={i} />)}
        </div>
      </section>
    </div>
  )
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Suspense fallback={<FeedSkeleton />}>
        <FeedContent userId={user.id} />
      </Suspense>
    </div>
  )
}
