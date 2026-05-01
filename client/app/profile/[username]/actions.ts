'use server'

import { createClient } from '@/lib/supabase/server'

export async function followUser(followingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: followingId })

  return { error: error?.message ?? null }
}

export async function unfollowUser(followingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  return { error: error?.message ?? null }
}

export async function sendFollowRequest(requestedId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('follow_requests')
    .insert({ requester_id: user.id, requested_id: requestedId })

  return { error: error?.message ?? null }
}

export async function cancelFollowRequest(requestedId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('follow_requests')
    .delete()
    .eq('requester_id', user.id)
    .eq('requested_id', requestedId)

  return { error: error?.message ?? null }
}
