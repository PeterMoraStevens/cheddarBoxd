import { createClient } from '@/lib/supabase/server'
import { UserCard } from '@/components/social/UserCard'
import { Pagination } from './Pagination'
import type { Profile } from '@/types/database'

const PEOPLE_PAGE_SIZE = 20

interface PeopleResultsProps {
  query: string
  page: number
  currentUserId?: string
  paginationParams: Record<string, string>
}

export async function PeopleResults({ query, page, currentUserId, paginationParams }: PeopleResultsProps) {
  const supabase = await createClient()

  const from = (page - 1) * PEOPLE_PAGE_SIZE
  const to = from + PEOPLE_PAGE_SIZE - 1
  const { data, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .range(from, to)

  const users = (data ?? []) as Profile[]
  const peopleTotal = count ?? 0

  let followingIds = new Set<string>()
  let pendingRequestIds = new Set<string>()

  if (currentUserId && users.length > 0) {
    const userIds = users.map((u) => u.id)
    const [{ data: follows }, { data: pendingReqs }] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', currentUserId).in('following_id', userIds),
      supabase.from('follow_requests').select('requested_id').eq('requester_id', currentUserId).in('requested_id', userIds),
    ])
    followingIds = new Set((follows ?? []).map((f) => (f as { following_id: string }).following_id))
    pendingRequestIds = new Set((pendingReqs ?? []).map((r) => (r as { requested_id: string }).requested_id))
  }

  if (users.length === 0) {
    return (
      <div className="neo-card p-12 text-center">
        <h2 className="font-black text-xl mb-2">No results</h2>
        <p className="text-[color:var(--text-muted)] text-sm">No users found matching &ldquo;{query}&rdquo;.</p>
      </div>
    )
  }

  const peoplePages = Math.ceil(peopleTotal / PEOPLE_PAGE_SIZE)

  return (
    <>
      <div className="flex flex-col gap-3 max-w-xl">
        {users.map((profile) => (
          <UserCard
            key={profile.id}
            profile={profile}
            currentUserId={currentUserId}
            isFollowing={followingIds.has(profile.id)}
            hasPendingRequest={pendingRequestIds.has(profile.id)}
          />
        ))}
      </div>
      <Pagination page={page} totalPages={peoplePages} params={paginationParams} />
    </>
  )
}
