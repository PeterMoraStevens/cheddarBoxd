'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserMinus, Clock } from 'lucide-react'
import { toast } from '@/lib/toast'
import { followUser, unfollowUser, sendFollowRequest, cancelFollowRequest } from './actions'

interface FollowButtonProps {
  followingId: string
  initialIsFollowing: boolean
  isPrivate?: boolean
  initialHasPendingRequest?: boolean
}

export function FollowButton({
  followingId,
  initialIsFollowing,
  isPrivate = false,
  initialHasPendingRequest = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [hasPendingRequest, setHasPendingRequest] = useState(initialHasPendingRequest)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function toggle() {
    setLoading(true)

    if (isFollowing) {
      const { error } = await unfollowUser(followingId)
      if (!error) {
        toast('Unfollowed.', 'info')
        setIsFollowing(false)
      } else {
        toast('Could not unfollow. Try again.', 'error')
      }
    } else if (hasPendingRequest) {
      const { error } = await cancelFollowRequest(followingId)
      if (!error) {
        toast('Request cancelled.', 'info')
        setHasPendingRequest(false)
      } else {
        toast('Could not cancel request. Try again.', 'error')
      }
    } else if (isPrivate) {
      const { error } = await sendFollowRequest(followingId)
      if (!error) {
        toast('Follow request sent!', 'success')
        setHasPendingRequest(true)
      } else {
        toast('Could not send request. Try again.', 'error')
      }
    } else {
      const { error } = await followUser(followingId)
      if (!error) {
        toast('Following!', 'success')
        setIsFollowing(true)
      } else {
        toast('Could not follow. Try again.', 'error')
      }
    }

    setLoading(false)
    startTransition(() => router.refresh())
  }

  const label = isFollowing
    ? 'Unfollow'
    : hasPendingRequest
      ? 'Requested'
      : 'Follow'

  const icon = isFollowing
    ? <UserMinus size={14} />
    : hasPendingRequest
      ? <Clock size={14} />
      : <UserPlus size={14} />

  const style = isFollowing
    ? 'bg-[color:var(--surface)] hover:bg-red-50'
    : hasPendingRequest
      ? 'bg-[color:var(--muted)] text-[color:var(--text-muted)]'
      : 'bg-primary text-ink'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`neo-btn px-4 py-2 text-sm font-semibold flex items-center gap-2 ${style} disabled:opacity-50`}
    >
      {icon}
      {label}
    </button>
  )
}
