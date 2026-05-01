import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ReviewForm } from './ReviewForm'
import { BackButton } from '@/components/ui/BackButton'
import { ProductImage } from '@/components/ui/ProductImage'
import { computeImgUrl } from '@/lib/compute-img-url'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']

interface ReviewPageProps {
  params: Promise<{ barcode: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { barcode } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth/login?next=/snack/${barcode}/review`)

  const [{ data: rawProduct }, { data: existing }] = await Promise.all([
    supabase.from('products').select('*').eq('barcode', barcode).single(),
    supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_barcode', barcode)
      .single(),
  ])

  const product = rawProduct as ProductRow | null
  if (!product) notFound()

  const imageUrl = product.image_url ?? computeImgUrl(barcode)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton label="Back" />
      </div>
      <h1 className="text-2xl font-black uppercase tracking-tight mb-6">
        {existing ? 'Edit your review' : 'Write a review'}
      </h1>

      {/* Product summary */}
      <div className="neo-card p-4 flex items-center gap-4 mb-8">
        <div className="w-16 h-16 shrink-0 relative border-2 border-[color:var(--border)] bg-[color:var(--muted)]">
          <ProductImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-1"
          />
        </div>
        <div>
          {product.brand && (
            <p className="text-xs uppercase tracking-widest text-[color:var(--text-muted)] font-bold">
              {product.brand}
            </p>
          )}
          <p className="font-black text-lg leading-tight">{product.name}</p>
        </div>
      </div>

      <ReviewForm
        barcode={barcode}
        userId={user.id}
        productName={product.name}
        productBrand={product.brand ?? undefined}
        productImageUrl={product.image_url ?? computeImgUrl(barcode)}
        existing={existing ?? undefined}
      />
    </div>
  )
}
