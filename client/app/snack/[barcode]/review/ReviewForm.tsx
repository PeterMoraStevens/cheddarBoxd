'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/toast'
import type { Review } from '@/types/database'

interface ReviewFormProps {
  barcode: string
  userId: string
  productName: string
  productBrand?: string
  productImageUrl?: string
  existing?: Review
}

export function ReviewForm({ barcode, userId, productName, productBrand, productImageUrl, existing }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(existing?.rating ?? 0)
  const [body, setBody] = useState(existing?.body ?? '')
  const [isPublic, setIsPublic] = useState(existing?.is_public ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating && !body.trim()) {
      setError('Add a rating or write something.')
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()

    let dbError: { message: string } | null = null
    let reviewId: string | null = null

    if (existing) {
      const { error } = await supabase.from('reviews').update({
        rating: rating || null,
        body: body.trim() || null,
        is_public: isPublic,
      }).eq('id', existing.id)
      dbError = error
      reviewId = existing.id
    } else {
      const { data, error } = await supabase.from('reviews').insert({
        user_id: userId,
        product_barcode: barcode,
        product_name: productName,
        product_brand: productBrand ?? null,
        product_image_url: productImageUrl ?? null,
        rating: rating || null,
        body: body.trim() || null,
        is_public: isPublic,
      }).select('id').single()
      dbError = error
      reviewId = data?.id ?? null
    }

    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      toast(dbError.message, 'error')
      return
    }

    toast(existing ? 'Review updated!' : 'Review posted!', 'success')
    router.push(reviewId ? `/review/${reviewId}` : `/snack/${barcode}`)
    router.refresh()
  }

  async function deleteReview() {
    if (!existing) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').delete().eq('id', existing.id)
    if (error) {
      toast('Could not delete review.', 'error')
      setLoading(false)
      return
    }
    toast('Review deleted.', 'info')
    router.push(`/snack/${barcode}`)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-black uppercase tracking-wide mb-3">Rating</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
        {rating > 0 && (
          <button
            type="button"
            onClick={() => setRating(0)}
            className="mt-2 text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text)] underline"
          >
            Clear rating
          </button>
        )}
      </div>

      {/* Review body */}
      <div>
        <label className="block text-sm font-black uppercase tracking-wide mb-2">Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you think? Be honest. Be yourself."
          rows={5}
          className="neo-input w-full px-3 py-3 text-sm resize-y min-h-[120px]"
        />
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">{body.length} characters</p>
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-[color:var(--muted)] border-2 border-[color:var(--border)] peer-checked:bg-primary peer-focus:ring-0 after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border after:border-gray-300 after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full after:border-[color:var(--border)]" />
        </label>
        <span className="text-sm font-semibold">Public review</span>
      </div>

      {error && (
        <p className="text-sm text-red-500 border-2 border-red-500 px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button variant="primary" size="lg" loading={loading} type="submit">
          {existing ? 'Save changes' : 'Post review'}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        {existing && (
          <Button
            variant="danger"
            size="lg"
            type="button"
            onClick={deleteReview}
            loading={loading}
            className="ml-auto"
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}
