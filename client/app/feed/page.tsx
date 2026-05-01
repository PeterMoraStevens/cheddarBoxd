import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReviewCard } from '@/components/social/ReviewCard'
import Link from 'next/link'
import { Users, Flame } from 'lucide-react'
import type { ReviewWithProfile } from '@/types/database'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Who the user follows
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = (follows ?? []).map((f) => f.following_id as string)

  // Run both queries in parallel; skip following query if user follows nobody
  const [
    { data: followingData, error: followingError },
    { data: popularData, error: popularError },
  ] = await Promise.all([
    // Reviews from people the current user follows (not their own)
    followingIds.length > 0
      ? supabase
          .from('reviews')
          .select('*, profiles!reviews_user_id_fkey(*), review_likes(user_id), comments(id)')
          .in('user_id', followingIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),

    // Recent public reviews from public accounts only
    supabase
      .from('reviews')
      .select('*, profiles!reviews_user_id_fkey(*), review_likes(user_id), comments(id)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(120),
  ])

  if (followingError) console.error('[feed] following query error:', followingError)
  if (popularError) console.error('[feed] popular query error:', popularError)

  const followingReviews = (followingData ?? []) as ReviewWithProfile[]

  // Popular: public accounts only, exclude reviews already in the following feed, sort by likes
  const followingReviewIds = new Set(followingReviews.map((r) => r.id))
  const allRecent = ((popularData ?? []) as ReviewWithProfile[])
    .filter((r) => !r.profiles?.is_private)

  const popularReviews = allRecent
    .filter((r) => !followingReviewIds.has(r.id))
    .sort((a, b) => (b.review_likes?.length ?? 0) - (a.review_likes?.length ?? 0))
    .slice(0, 18)

  // Fallback to most recent if none have likes yet
  const showPopular = popularReviews.length > 0
    ? popularReviews
    : allRecent.filter((r) => !followingReviewIds.has(r.id)).slice(0, 18)

  const hasPopular = showPopular.length > 0
  const popularLabel = popularReviews.some((r) => (r.review_likes?.length ?? 0) > 0) ? 'Popular' : 'Recent'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-12">

      {/* ── Following ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <Users size={22} className="text-primary" />
            Following
          </h1>
          {followingIds.length === 0 && (
            <Link href="/search" className="text-sm font-semibold text-primary hover:underline">
              Find people to follow →
            </Link>
          )}
        </div>

        {followingReviews.length === 0 ? (
          <div className="neo-card p-10 text-center">
            <div className="text-4xl mb-3">🧀</div>
            <p className="font-black text-xl mb-2">
              {followingIds.length === 0 ? 'Nobody followed yet' : 'Nothing new from your crew'}
            </p>
            <p className="text-[color:var(--text-muted)] text-sm mb-5">
              {followingIds.length === 0
                ? 'Follow some snack reviewers to see their posts here.'
                : 'Check back soon, or follow more people.'}
            </p>
            <Link href="/search" className="neo-btn bg-primary text-ink px-4 py-2 text-sm font-semibold inline-block">
              Explore
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {followingReviews.map((review) => (
              <ReviewCard key={review.id} review={review} currentUserId={user.id} />
            ))}
          </div>
        )}
      </section>

      {/* ── Popular / Recent ────────────────────────────────────── */}
      {hasPopular && (
        <section>
          <div className="flex items-center gap-2 mb-6 border-t-2 border-[color:var(--border)] pt-6">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Flame size={20} className="text-primary" />
              {popularLabel}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {showPopular.map((review) => (
              <ReviewCard key={review.id} review={review} currentUserId={user.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
