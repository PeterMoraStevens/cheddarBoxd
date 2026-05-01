'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Heart, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import Link from 'next/link'

interface Liker {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface LikeButtonProps {
  reviewId: string
  initialLiked: boolean
  initialCount: number
  userId?: string
}

export function LikeButton({ reviewId, initialLiked, initialCount, userId }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [likers, setLikers] = useState<Liker[] | null>(null)
  const [loadingLikers, setLoadingLikers] = useState(false)
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showModal) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowModal(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  async function toggle() {
    if (!userId) {
      router.push('/auth/login')
      return
    }

    const supabase = createClient()
    const optimisticLiked = !liked
    const optimisticCount = optimisticLiked ? count + 1 : count - 1

    setLiked(optimisticLiked)
    setCount(optimisticCount)
    setLikers(null) // invalidate cached likers

    if (optimisticLiked) {
      const { error } = await supabase
        .from('review_likes')
        .insert({ user_id: userId, review_id: reviewId })
      if (error) {
        setLiked(!optimisticLiked)
        setCount(count)
      }
    } else {
      const { error } = await supabase
        .from('review_likes')
        .delete()
        .eq('user_id', userId)
        .eq('review_id', reviewId)
      if (error) {
        setLiked(!optimisticLiked)
        setCount(count)
      }
    }

    startTransition(() => router.refresh())
  }

  async function openLikers() {
    if (count === 0) return
    setShowModal(true)
    if (likers !== null) return
    setLoadingLikers(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('review_likes')
      .select('profiles!user_id(id, username, display_name, avatar_url)')
      .eq('review_id', reviewId)
    setLikers(
      (data ?? [])
        .map((row) => (row as unknown as { profiles: Liker }).profiles)
        .filter(Boolean)
    )
    setLoadingLikers(false)
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            liked ? 'text-red-500' : 'text-[color:var(--text-muted)] hover:text-red-500'
          }`}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={openLikers}
          className={`text-sm font-medium transition-colors min-w-[1.25rem] text-left ${
            count > 0
              ? 'text-[color:var(--text-muted)] hover:text-primary underline-offset-2 hover:underline'
              : 'text-[color:var(--text-muted)] cursor-default'
          }`}
          aria-label="See who liked this"
          disabled={count === 0}
        >
          {count}
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            ref={modalRef}
            className="neo-card w-full max-w-sm p-0 overflow-hidden"
            style={{ boxShadow: '6px 6px 0 var(--border)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[color:var(--border)]">
              <h3 className="font-black text-sm uppercase tracking-wide">
                {count} {count === 1 ? 'Like' : 'Likes'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {loadingLikers ? (
                <div className="px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
                  Loading...
                </div>
              ) : likers && likers.length > 0 ? (
                <ul>
                  {likers.map((liker) => (
                    <li key={liker.id}>
                      <Link
                        href={`/profile/${liker.username}`}
                        onClick={() => setShowModal(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[color:var(--muted)] transition-colors border-b border-[color:var(--muted)] last:border-0"
                      >
                        <Avatar
                          src={liker.avatar_url}
                          name={liker.display_name || liker.username}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">
                            {liker.display_name || liker.username}
                          </p>
                          <p className="text-xs text-[color:var(--text-muted)] truncate">
                            @{liker.username}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
                  No likes yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
