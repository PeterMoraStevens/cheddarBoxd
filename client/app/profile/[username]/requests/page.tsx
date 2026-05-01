import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'
import { FollowRequestItem } from './FollowRequestItem'
import type { Profile } from '@/types/database'

interface RequestsPageProps {
  params: Promise<{ username: string }>
}

export default async function FollowRequestsPage({ params }: RequestsPageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/profile/${username}/requests`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()
  if (profile.id !== user.id) redirect(`/profile/${username}`)

  const { data: requests } = await supabase
    .from('follow_requests')
    .select('*, profiles!requester_id(*)')
    .eq('requested_id', profile.id)
    .order('created_at', { ascending: false })

  const typedRequests = (requests ?? []) as { requester_id: string; profiles: Profile }[]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton label="Back to profile" />
      </div>

      <h1 className="text-2xl font-black uppercase tracking-tight mb-6">
        Follow Requests
      </h1>

      {typedRequests.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <p className="text-[color:var(--text-muted)] text-sm">No pending follow requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {typedRequests.map((req) => (
            <FollowRequestItem
              key={req.requester_id}
              requester={req.profiles}
              requestedId={profile.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
