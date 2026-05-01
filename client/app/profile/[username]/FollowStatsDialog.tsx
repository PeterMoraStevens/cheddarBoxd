'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { FollowButton } from './FollowButton'
import { Users, X } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types/database'

interface ProfileWithFollow extends Profile {
  isFollowing: boolean
}

interface FollowStatsDialogProps {
  profileId: string
  username: string
  followerCount: number
  followingCount: number
  currentUserId?: string
}

type Tab = 'followers' | 'following'

export function FollowStatsDialog({
  profileId,
  username,
  followerCount,
  followingCount,
  currentUserId,
}: FollowStatsDialogProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('followers')
  const [followers, setFollowers] = useState<ProfileWithFollow[] | null>(null)
  const [following, setFollowing] = useState<ProfileWithFollow[] | null>(null)
  const [loading, setLoading] = useState(false)

  const loadFollowers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: rows } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', profileId)
      .order('created_at', { ascending: false })

    const ids = (rows ?? []).map((r) => r.follower_id)

    if (ids.length === 0) {
      setFollowers([])
      setLoading(false)
      return
    }

    const [{ data: profiles }, { data: myFollowRows }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ids),
      currentUserId
        ? supabase.from('follows').select('following_id').eq('follower_id', currentUserId).in('following_id', ids)
        : Promise.resolve({ data: [] }),
    ])

    const myFollowingSet = new Set((myFollowRows ?? []).map((r) => r.following_id))
    const sorted = (profiles ?? [])
      .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
      .map((p) => ({ ...p, isFollowing: myFollowingSet.has(p.id) }))

    setFollowers(sorted)
    setLoading(false)
  }, [profileId, currentUserId])

  const loadFollowing = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: rows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', profileId)
      .order('created_at', { ascending: false })

    const ids = (rows ?? []).map((r) => r.following_id)

    if (ids.length === 0) {
      setFollowing([])
      setLoading(false)
      return
    }

    const [{ data: profiles }, { data: myFollowRows }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ids),
      currentUserId
        ? supabase.from('follows').select('following_id').eq('follower_id', currentUserId).in('following_id', ids)
        : Promise.resolve({ data: [] }),
    ])

    const myFollowingSet = new Set((myFollowRows ?? []).map((r) => r.following_id))
    const sorted = (profiles ?? [])
      .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
      .map((p) => ({ ...p, isFollowing: myFollowingSet.has(p.id) }))

    setFollowing(sorted)
    setLoading(false)
  }, [profileId, currentUserId])

  function openDialog(t: Tab) {
    setTab(t)
    setOpen(true)
  }

  function close() {
    setOpen(false)
    // Invalidate so next open re-fetches fresh follow state
    setFollowers(null)
    setFollowing(null)
  }

  useEffect(() => {
    if (!open) return
    if (tab === 'followers' && followers === null) loadFollowers()
    if (tab === 'following' && following === null) loadFollowing()
  }, [open, tab, followers, following, loadFollowers, loadFollowing])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const list = tab === 'followers' ? followers : following

  return (
    <>
      {/* Stat triggers */}
      <button
        onClick={() => openDialog('followers')}
        className="flex items-center gap-1.5 hover:text-primary transition-colors group"
      >
        <Users size={14} className="text-[color:var(--text-muted)] group-hover:text-primary transition-colors" />
        <span className="font-black text-lg">{followerCount}</span>
        <span className="text-xs uppercase tracking-wide text-[color:var(--text-muted)] group-hover:text-primary font-semibold transition-colors">
          Followers
        </span>
      </button>

      <button
        onClick={() => openDialog('following')}
        className="flex items-center gap-1.5 hover:text-primary transition-colors group"
      >
        <Users size={14} className="text-[color:var(--text-muted)] group-hover:text-primary transition-colors" />
        <span className="font-black text-lg">{followingCount}</span>
        <span className="text-xs uppercase tracking-wide text-[color:var(--text-muted)] group-hover:text-primary font-semibold transition-colors">
          Following
        </span>
      </button>

      {/* Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div
            className="neo-card w-full max-w-sm flex flex-col overflow-hidden"
            style={{ maxHeight: '80vh', boxShadow: '6px 6px 0 var(--border)' }}
          >
            {/* Header with tabs */}
            <div className="flex items-center border-b-2 border-[color:var(--border)]">
              {(['followers', 'following'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-black uppercase tracking-wide transition-colors ${
                    tab === t
                      ? 'bg-primary text-ink'
                      : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)]'
                  }`}
                >
                  {t === 'followers' ? `${followerCount} Followers` : `${followingCount} Following`}
                </button>
              ))}
              <button
                onClick={close}
                className="px-4 py-3 text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors border-l-2 border-[color:var(--border)]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loading || list === null ? (
                <div className="flex items-center justify-center py-12 text-sm text-[color:var(--text-muted)]">
                  Loading…
                </div>
              ) : list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-6">
                  <span className="text-3xl">{tab === 'followers' ? '👤' : '🔍'}</span>
                  <p className="font-black">
                    {tab === 'followers' ? 'No followers yet' : 'Not following anyone'}
                  </p>
                  {tab === 'following' && (
                    <Link
                      href="/search"
                      onClick={close}
                      className="text-sm text-primary font-semibold hover:underline"
                    >
                      Find people to follow →
                    </Link>
                  )}
                </div>
              ) : (
                <ul>
                  {list.map((person) => (
                    <li
                      key={person.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--muted)] last:border-0 hover:bg-[color:var(--muted)] transition-colors"
                    >
                      <Link
                        href={`/profile/${person.username}`}
                        onClick={close}
                        className="shrink-0"
                      >
                        <Avatar
                          src={person.avatar_url}
                          name={person.display_name || person.username}
                          size="sm"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/profile/${person.username}`}
                          onClick={close}
                          className="font-bold text-sm hover:text-primary transition-colors block truncate"
                        >
                          {person.display_name || person.username}
                        </Link>
                        <p className="text-xs text-[color:var(--text-muted)] truncate">@{person.username}</p>
                      </div>
                      {currentUserId && currentUserId !== person.id && (
                        <div className="shrink-0">
                          <FollowButton
                            followingId={person.id}
                            initialIsFollowing={person.isFollowing}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
