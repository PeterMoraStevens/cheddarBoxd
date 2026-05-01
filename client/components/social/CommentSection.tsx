'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatDistanceToNow } from './dateUtils'
import Link from 'next/link'
import type { Comment, Profile } from '@/types/database'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

interface CommentWithProfile extends Comment {
  profiles: Profile
}

interface CommentSectionProps {
  reviewId: string
  reviewOwnerId?: string
  comments: CommentWithProfile[]
  currentUser?: Profile | null
}

export function CommentSection({ reviewId, reviewOwnerId, comments: initial, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState(initial)
  const [body, setBody] = useState('')
  const [, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser || !body.trim()) return

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: currentUser.id, review_id: reviewId, body: body.trim() })
      .select('*, profiles(*)')
      .single()

    setLoading(false)
    if (!error && data) {
      setComments([...comments, data as CommentWithProfile])
      setBody('')
      toast('Comment posted!', 'success')
      startTransition(() => router.refresh())
    } else if (error) {
      toast('Could not post comment. Try again.', 'error')
    }
  }

  async function deleteComment(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (!error) {
      setComments(comments.filter((c) => c.id !== id))
      toast('Comment deleted.', 'info')
      startTransition(() => router.refresh())
    } else {
      toast('Could not delete comment.', 'error')
    }
  }

  return (
    <div id="comments" className="flex flex-col gap-4">
      <h3 className="font-black text-base uppercase tracking-wide">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h3>

      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Link href={`/profile/${comment.profiles.username}`}>
            <Avatar src={comment.profiles.avatar_url} name={comment.profiles.display_name || comment.profiles.username} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="neo-card p-3">
              <div className="flex items-baseline gap-2 mb-1">
                <Link href={`/profile/${comment.profiles.username}`} className="font-bold text-sm hover:text-primary transition-colors">
                  {comment.profiles.display_name || comment.profiles.username}
                </Link>
                <span className="text-xs text-[color:var(--text-muted)]">
                  {formatDistanceToNow(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-[color:var(--text)] leading-relaxed">{comment.body}</p>
            </div>
            {(currentUser?.id === comment.user_id || currentUser?.id === reviewOwnerId) && (
              <button
                onClick={() => deleteComment(comment.id)}
                className="mt-1 flex items-center gap-1 text-xs text-[color:var(--text-muted)] hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
          </div>
        </div>
      ))}

      {currentUser ? (
        <form onSubmit={submit} className="flex gap-3 items-start">
          <Avatar src={currentUser.avatar_url} name={currentUser.display_name || currentUser.username} size="sm" />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="neo-input w-full px-3 py-2 text-sm resize-none"
            />
            <div className="flex justify-end">
              <Button variant="primary" size="sm" loading={loading} disabled={!body.trim()}>
                Post
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-[color:var(--text-muted)]">
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">Sign in</Link> to comment.
        </p>
      )}
    </div>
  )
}
