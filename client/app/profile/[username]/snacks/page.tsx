import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SnackGraph } from './SnackGraph'
import type { SnackData } from './SnackGraph'
import { computeImgUrl } from '@/lib/compute-img-url'

interface SnackMapPageProps {
  params: Promise<{ username: string }>
}

export default async function SnackMapPage({ params }: SnackMapPageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('product_barcode, product_name, product_brand, product_image_url, rating')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (!reviews || reviews.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-baseline gap-4 mb-6">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            {profile.display_name || profile.username}&apos;s Snack Map
          </h1>
          <a href={`/profile/${username}`} className="text-sm font-semibold text-primary hover:underline">
            ← Back to profile
          </a>
        </div>
        <div className="neo-card p-12 text-center">
          <div className="text-5xl mb-4">🧀</div>
          <h2 className="font-black text-xl mb-2">No reviews yet</h2>
          <p className="text-[color:var(--text-muted)] text-sm">
            Review some snacks to see your flavor map come to life.
          </p>
        </div>
      </div>
    )
  }

  const snacks: SnackData[] = reviews.map((r) => ({
    barcode: r.product_barcode,
    name: r.product_name,
    brand: r.product_brand,
    imageUrl: r.product_image_url ?? computeImgUrl(r.product_barcode),
    rating: r.rating,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight">
          {profile.display_name || profile.username}&apos;s Snack Map
        </h1>
        <a href={`/profile/${username}`} className="text-sm font-semibold text-primary hover:underline">
          ← Back to profile
        </a>
      </div>

      <div className="neo-card overflow-hidden mb-4" style={{ height: '70vh' }}>
        <SnackGraph snacks={snacks} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
        {[
          { label: '5★', color: '#3DEB78' },
          { label: '4★', color: '#8BC34A' },
          { label: '3★', color: '#FFD700' },
          { label: '2★', color: '#FF9F40' },
          { label: '1★', color: '#FF6B6B' },
          { label: 'Unrated', color: '#888880' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 border border-[color:var(--border)]" style={{ background: color }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-6 border-t border-dashed border-[color:var(--text-muted)]" />
          Same brand
        </div>
        <p className="ml-auto normal-case">Click a snack to view · Drag to rearrange</p>
      </div>
    </div>
  )
}
