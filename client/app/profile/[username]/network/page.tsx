import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { NetworkGraph } from './NetworkGraph'
import type { Profile } from '@/types/database'

interface NetworkPageProps {
  params: Promise<{ username: string }>
}

export default async function NetworkPage({ params }: NetworkPageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Fetch follow relationships separately to avoid join type complexity
  const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
    supabase.from('follows').select('following_id').eq('follower_id', profile.id),
    supabase.from('follows').select('follower_id').eq('following_id', profile.id),
  ])

  const followingIds = (followingRows ?? []).map((r) => (r as { following_id: string }).following_id)
  const followerIds = (followerRows ?? []).map((r) => (r as { follower_id: string }).follower_id)
  const allIds = [...new Set([...followingIds, ...followerIds])]

  // Fetch profile data for all connected users
  let connectedProfiles: Profile[] = []
  if (allIds.length > 0) {
    const { data } = await supabase.from('profiles').select('*').in('id', allIds)
    connectedProfiles = data ?? []
  }

  // Build graph data
  const allProfiles = [profile, ...connectedProfiles.filter((p) => p.id !== profile.id)]
  const edges: { source: string; target: string }[] = [
    ...followingIds.map((id) => ({ source: profile.id, target: id })),
    ...followerIds.map((id) => ({ source: id, target: profile.id })),
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight">
          {profile.display_name || profile.username}&apos;s Network
        </h1>
        <a href={`/profile/${username}`} className="text-sm font-semibold text-primary hover:underline">
          ← Back to profile
        </a>
      </div>

      {allProfiles.length <= 1 ? (
        <div className="neo-card p-12 text-center">
          <div className="text-5xl mb-4">🌐</div>
          <h2 className="font-black text-xl mb-2">No connections yet</h2>
          <p className="text-[color:var(--text-muted)] text-sm">
            Follow people or get followers to build your network.
          </p>
        </div>
      ) : (
        <>
          <div className="neo-card overflow-hidden" style={{ height: '70vh' }}>
            <NetworkGraph nodes={allProfiles} edges={edges} centerId={profile.id} />
          </div>

          <div className="mt-4 flex items-center gap-6 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-primary" />
              Mutual follow
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t border-dashed border-[color:var(--text-muted)]" />
              One-way
            </div>
          </div>
        </>
      )}
    </div>
  )
}
