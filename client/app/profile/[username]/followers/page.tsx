import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { UserCard } from '@/components/social/UserCard'
import Link from 'next/link'
import type { Profile } from '@/types/database'

interface FollowersPageProps {
  params: Promise<{ username: string }>
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: followRows } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', profile.id)
    .order('created_at', { ascending: false })

  const followerIds = (followRows ?? []).map((r) => r.follower_id)

  let followers: Profile[] = []
  if (followerIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', followerIds)
    followers = (data ?? []).sort(
      (a, b) => followerIds.indexOf(a.id) - followerIds.indexOf(b.id)
    )
  }

  let followingSet = new Set<string>()
  if (currentUser && followers.length > 0) {
    const { data: myFollowing } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)
      .in('following_id', followerIds)
    followingSet = new Set((myFollowing ?? []).map((r) => r.following_id))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight">
          {profile.display_name || profile.username}&apos;s Followers
        </h1>
        <Link href={`/profile/${username}`} className="text-sm font-semibold text-primary hover:underline">
          ← Back
        </Link>
      </div>

      {followers.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <div className="text-4xl mb-3">👤</div>
          <p className="font-black text-lg mb-1">No followers yet</p>
          <p className="text-sm text-[color:var(--text-muted)]">Share your profile to grow your audience.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {followers.map((f) => (
            <UserCard
              key={f.id}
              profile={f}
              currentUserId={currentUser?.id}
              isFollowing={followingSet.has(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
