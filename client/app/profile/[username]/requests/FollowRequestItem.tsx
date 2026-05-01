'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import type { Profile } from '@/types/database'

interface FollowRequestItemProps {
  requester: Profile
  requestedId: string
}

export function FollowRequestItem({ requester, requestedId }: FollowRequestItemProps) {
  const [gone, setGone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function accept() {
    setLoading(true)
    const supabase = createClient()
    const { error: followError } = await supabase
      .from('follows')
      .insert({ follower_id: requester.id, following_id: requestedId })

    if (followError) {
      toast('Could not accept request.', 'error')
      setLoading(false)
      return
    }

    await supabase
      .from('follow_requests')
      .delete()
      .eq('requester_id', requester.id)
      .eq('requested_id', requestedId)

    toast(`${requester.display_name || requester.username} is now following you.`, 'success')
    setGone(true)
    setLoading(false)
    startTransition(() => router.refresh())
  }

  async function decline() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('follow_requests')
      .delete()
      .eq('requester_id', requester.id)
      .eq('requested_id', requestedId)

    if (error) {
      toast('Could not decline request.', 'error')
      setLoading(false)
      return
    }

    toast('Request declined.', 'info')
    setGone(true)
    setLoading(false)
    startTransition(() => router.refresh())
  }

  if (gone) return null

  return (
    <div className="neo-card p-4 flex items-center gap-4">
      <Link href={`/profile/${requester.username}`} className="shrink-0">
        <Avatar
          src={requester.avatar_url}
          name={requester.display_name || requester.username}
          size="md"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${requester.username}`}
          className="font-bold hover:text-primary transition-colors block truncate"
        >
          {requester.display_name || requester.username}
        </Link>
        <p className="text-xs text-[color:var(--text-muted)] truncate">@{requester.username}</p>
        {requester.bio && (
          <p className="text-xs text-[color:var(--text-muted)] mt-1 line-clamp-1">{requester.bio}</p>
        )}
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={accept}
          disabled={loading}
          className="neo-btn bg-primary text-ink px-3 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          <Check size={14} />
          Accept
        </button>
        <button
          onClick={decline}
          disabled={loading}
          className="neo-btn bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          <X size={14} />
          Decline
        </button>
      </div>
    </div>
  )
}
