import { createClient } from '@/lib/supabase/server'
import { searchLocalProducts, productRowToSearchProduct } from '@/lib/supabase/products'
import type { ProductFilters } from '@/lib/supabase/products'
import { SnackCard } from '@/components/snack/SnackCard'
import { Pagination } from './Pagination'

const PAGE_SIZE = 24

interface SnackResultsProps {
  query: string
  page: number
  categories: string[]
  effectiveCountry: string
  ratingMin: number | undefined
  ratingMax: number | undefined
  sort: string | undefined
  currentUserId?: string
  paginationParams: Record<string, string>
}

export async function SnackResults({
  query,
  page,
  categories,
  effectiveCountry,
  ratingMin,
  ratingMax,
  sort,
  paginationParams,
}: SnackResultsProps) {
  const supabase = await createClient()

  const needsRatings =
    ratingMin !== undefined || ratingMax !== undefined ||
    sort === 'popular' || sort === 'unpopular'

  const allRatings = new Map<string, { sum: number; count: number }>()

  if (needsRatings) {
    const { data: ratingRows } = await supabase
      .from('reviews')
      .select('product_barcode, rating')
      .not('rating', 'is', null)

    for (const row of ratingRows ?? []) {
      if (row.rating == null) continue
      const existing = allRatings.get(row.product_barcode)
      if (existing) { existing.sum += row.rating; existing.count += 1 }
      else allRatings.set(row.product_barcode, { sum: row.rating, count: 1 })
    }
  }

  let barcodeWhitelist: string[] | undefined
  if (ratingMin !== undefined || ratingMax !== undefined) {
    barcodeWhitelist = []
    for (const [barcode, { sum, count }] of allRatings) {
      const avg = sum / count
      if (ratingMin !== undefined && avg < ratingMin) continue
      if (ratingMax !== undefined && avg > ratingMax) continue
      barcodeWhitelist.push(barcode)
    }
  }

  if (sort === 'popular' || sort === 'unpopular') {
    const sortedBarcodes = [...allRatings.entries()]
      .sort((a, b) => {
        const avgA = a[1].sum / a[1].count
        const avgB = b[1].sum / b[1].count
        return sort === 'popular' ? avgB - avgA : avgA - avgB
      })
      .map(([b]) => b)
    barcodeWhitelist = barcodeWhitelist
      ? sortedBarcodes.filter((b) => barcodeWhitelist!.includes(b))
      : sortedBarcodes
  }

  const filters: ProductFilters = {
    categories: categories.length > 0 ? categories : undefined,
    country: effectiveCountry || undefined,
    barcodeWhitelist,
  }

  const { results, total } = await searchLocalProducts(query, page, PAGE_SIZE, filters)
  let products = results.map(productRowToSearchProduct)

  if ((sort === 'popular' || sort === 'unpopular') && products.length > 0) {
    products = products.sort((a, b) => {
      const da = allRatings.get(a.code)
      const db = allRatings.get(b.code)
      const avgA = da ? da.sum / da.count : 0
      const avgB = db ? db.sum / db.count : 0
      return sort === 'popular' ? avgB - avgA : avgA - avgB
    })
  }

  // Fetch per-card ratings (reuse allRatings if already fetched)
  const productRatings = new Map<string, { avg: number; count: number } | null>()
  for (const p of products) productRatings.set(p.code, null)

  if (needsRatings) {
    for (const [barcode, { sum, count }] of allRatings) {
      if (productRatings.has(barcode)) {
        productRatings.set(barcode, { avg: sum / count, count })
      }
    }
  } else if (products.length > 0) {
    const barcodes = products.map((p) => p.code)
    const { data: ratingRows } = await supabase
      .from('reviews')
      .select('product_barcode, rating')
      .in('product_barcode', barcodes)
      .not('rating', 'is', null)

    const acc = new Map<string, { sum: number; count: number }>()
    for (const r of ratingRows ?? []) {
      if (r.rating == null) continue
      const e = acc.get(r.product_barcode) ?? { sum: 0, count: 0 }
      acc.set(r.product_barcode, { sum: e.sum + r.rating, count: e.count + 1 })
    }
    for (const [barcode, { sum, count }] of acc) {
      productRatings.set(barcode, { avg: sum / count, count })
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (products.length === 0) {
    return (
      <div className="neo-card p-12 text-center">
        <h2 className="font-black text-xl mb-2">No results</h2>
        <p className="text-[color:var(--text-muted)] text-sm">Try adjusting your search or filters.</p>
      </div>
    )
  }

  return (
    <>
      <p className="font-semibold text-sm mb-4">
        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
        {query ? <> for &ldquo;{query}&rdquo;</> : ''}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map((product) => {
          const ratingData = productRatings.get(product.code)
          return (
            <SnackCard
              key={product.code}
              product={product}
              avgRating={ratingData ? ratingData.avg : ratingData === null ? null : undefined}
              reviewCount={ratingData?.count}
            />
          )
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} params={paginationParams} />
    </>
  )
}
