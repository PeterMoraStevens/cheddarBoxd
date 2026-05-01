import { Suspense } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { searchLocalProducts, productRowToSearchProduct } from '@/lib/supabase/products'
import type { ProductFilters } from '@/lib/supabase/products'
import { detectCountryFromAcceptLanguage } from '@/lib/openfoodfacts/countries'
import { SnackCard } from '@/components/snack/SnackCard'
import { UserCard } from '@/components/social/UserCard'
import { SearchBar } from './SearchBar'
import { SearchFilters } from './SearchFilters'
import Link from 'next/link'
import type { OFFSearchProduct } from '@/lib/openfoodfacts/client'
import type { Profile } from '@/types/database'

const SNACK_PAGE_SIZE = 24
const PEOPLE_PAGE_SIZE = 20

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    page?: string
    tab?: string
    categories?: string
    country?: string
    ratingMin?: string
    ratingMax?: string
    sort?: string
  }>
}

function pageHref(params: Record<string, string>, page: number) {
  const p = new URLSearchParams(params)
  if (page > 1) p.set('page', String(page))
  else p.delete('page')
  return `/search?${p}`
}

function Pagination({ page, totalPages, params }: { page: number; totalPages: number; params: Record<string, string> }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      {page > 1 ? (
        <Link href={pageHref(params, page - 1)} className="neo-btn bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold">
          ← Previous
        </Link>
      ) : (
        <span className="neo-btn bg-[color:var(--muted)] px-4 py-2 text-sm font-semibold opacity-40 cursor-not-allowed">
          ← Previous
        </span>
      )}
      <span className="text-sm font-semibold tabular-nums">{page} / {totalPages}</span>
      {page < totalPages ? (
        <Link href={pageHref(params, page + 1)} className="neo-btn bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold">
          Next →
        </Link>
      ) : (
        <span className="neo-btn bg-[color:var(--muted)] px-4 py-2 text-sm font-semibold opacity-40 cursor-not-allowed">
          Next →
        </span>
      )}
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const tab = params.tab === 'people' ? 'people' : 'snacks'
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const ratingMin = params.ratingMin ? parseFloat(params.ratingMin) : undefined
  const ratingMax = params.ratingMax ? parseFloat(params.ratingMax) : undefined

  const hdrs = await headers()
  const detectedCountry = detectCountryFromAcceptLanguage(hdrs.get('accept-language') ?? '')
  // undefined = not in URL (use auto-detect), '' = explicitly "All", 'x' = user-chosen
  const effectiveCountry = params.country === undefined ? detectedCountry : params.country

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sort = params.sort // 'popular' | 'unpopular' | undefined
  let products: OFFSearchProduct[] = []
  let snackTotal = 0
  let users: Profile[] = []
  let peopleTotal = 0
  let followingIds = new Set<string>()
  const productRatings = new Map<string, { avg: number; count: number } | null>()

  if (tab === 'snacks') {
    const selectedCategories = params.categories
      ? params.categories.split(',').filter(Boolean)
      : []

    // Fetch all ratings when needed for filtering or sorting
    const needsRatings = ratingMin !== undefined || ratingMax !== undefined || sort === 'popular' || sort === 'unpopular'
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

    // Build barcode whitelist for rating range filter
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

    // Overlay popularity sort order onto the whitelist
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
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      country: effectiveCountry || undefined,
      barcodeWhitelist,
    }

    const { results, total } = await searchLocalProducts(query, page, SNACK_PAGE_SIZE, filters)
    products = results.map(productRowToSearchProduct)
    snackTotal = total

    // Re-sort in memory — PostgREST IN() doesn't preserve list order
    if ((sort === 'popular' || sort === 'unpopular') && products.length > 0) {
      products.sort((a, b) => {
        const da = allRatings.get(a.code)
        const db = allRatings.get(b.code)
        const avgA = da ? da.sum / da.count : 0
        const avgB = db ? db.sum / db.count : 0
        return sort === 'popular' ? avgB - avgA : avgA - avgB
      })
    }

    // Populate productRatings for display — reuse allRatings if already fetched
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
  }

  let pendingRequestIds = new Set<string>()

  if (query && tab === 'people') {
    const from = (page - 1) * PEOPLE_PAGE_SIZE
    const to = from + PEOPLE_PAGE_SIZE - 1

    const { data, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .range(from, to)

    users = (data ?? []) as Profile[]
    peopleTotal = count ?? 0

    if (user && users.length > 0) {
      const userIds = users.map((u) => u.id)
      const [{ data: follows }, { data: pendingReqs }] = await Promise.all([
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', userIds),
        supabase
          .from('follow_requests')
          .select('requested_id')
          .eq('requester_id', user.id)
          .in('requested_id', userIds),
      ])
      followingIds = new Set((follows ?? []).map((f) => (f as { following_id: string }).following_id))
      pendingRequestIds = new Set((pendingReqs ?? []).map((r) => (r as { requested_id: string }).requested_id))
    }
  }

  const snackPages = Math.ceil(snackTotal / SNACK_PAGE_SIZE)
  const peoplePages = Math.ceil(peopleTotal / PEOPLE_PAGE_SIZE)

  const paginationParams: Record<string, string> = { tab }
  if (query) paginationParams.q = query
  if (params.categories) paginationParams.categories = params.categories
  if (effectiveCountry) paginationParams.country = effectiveCountry
  if (params.ratingMin) paginationParams.ratingMin = params.ratingMin
  if (params.ratingMax) paginationParams.ratingMax = params.ratingMax
  if (params.sort) paginationParams.sort = params.sort

  const snacksHref = query ? `/search?q=${encodeURIComponent(query)}` : '/search'
  const peopleHref = query ? `/search?q=${encodeURIComponent(query)}&tab=people` : '/search?tab=people'

  // Use explicit params (not effectiveCountry) so auto-detected country doesn't trigger results view on empty query
  const hasFilters = !!(params.categories || params.country || params.ratingMin || params.ratingMax || params.sort)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Search</h1>
        <Suspense fallback={null}>
          <div className="flex gap-2 items-stretch max-w-3xl">
            <div className="flex-1">
              <SearchBar defaultValue={query} tab={tab} />
            </div>
            {tab === 'snacks' && (
              <SearchFilters query={query} defaultCountry={detectedCountry} />
            )}
          </div>
        </Suspense>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-2 border-[color:var(--border)] w-fit">
        <Link
          href={snacksHref}
          className={`px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
            tab === 'snacks'
              ? 'bg-primary text-ink'
              : 'bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--muted)]'
          }`}
        >
          Snacks
        </Link>
        <Link
          href={peopleHref}
          className={`px-5 py-2 text-sm font-bold uppercase tracking-wide border-l-2 border-[color:var(--border)] transition-colors ${
            tab === 'people'
              ? 'bg-primary text-ink'
              : 'bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--muted)]'
          }`}
        >
          People
        </Link>
      </div>

      {/* Snacks tab */}
      {tab === 'snacks' && (
        <>
          {!query && !hasFilters && (
            <div className="neo-card p-12 text-center">
              <h2 className="font-black text-xl mb-2">Search for a snack</h2>
              <p className="text-[color:var(--text-muted)] text-sm">
                Chips, chocolate, cheese, energy drinks — or use the Filters button to browse by rating, NOVA group, category, or country.
              </p>
            </div>
          )}

          {(query || hasFilters) && (
            <div className="mb-4">
              <span className="font-semibold text-sm">
                {snackTotal.toLocaleString()} result{snackTotal !== 1 ? 's' : ''}
                {query ? <> for &ldquo;{query}&rdquo;</> : ''}
              </span>
            </div>
          )}

          {(query || hasFilters) && products.length === 0 && (
            <div className="neo-card p-12 text-center">
              <h2 className="font-black text-xl mb-2">No results</h2>
              <p className="text-[color:var(--text-muted)] text-sm">Try adjusting your search or filters.</p>
            </div>
          )}

          {products.length > 0 && (
            <>
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
              <Pagination page={page} totalPages={snackPages} params={paginationParams} />
            </>
          )}
        </>
      )}

      {/* People tab */}
      {tab === 'people' && (
        <>
          {!query && (
            <div className="neo-card p-12 text-center">
              <h2 className="font-black text-xl mb-2">Find people</h2>
              <p className="text-[color:var(--text-muted)] text-sm">
                Search by name or username to find and follow other snack lovers.
              </p>
            </div>
          )}

          {query && users.length === 0 && (
            <div className="neo-card p-12 text-center">
              <h2 className="font-black text-xl mb-2">No results</h2>
              <p className="text-[color:var(--text-muted)] text-sm">
                No users found matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}

          {users.length > 0 && (
            <>
              <div className="flex flex-col gap-3 max-w-xl">
                {users.map((profile) => (
                  <UserCard
                    key={profile.id}
                    profile={profile}
                    currentUserId={user?.id}
                    isFollowing={followingIds.has(profile.id)}
                    hasPendingRequest={pendingRequestIds.has(profile.id)}
                  />
                ))}
              </div>
              <Pagination page={page} totalPages={peoplePages} params={paginationParams} />
            </>
          )}
        </>
      )}
    </div>
  )
}
