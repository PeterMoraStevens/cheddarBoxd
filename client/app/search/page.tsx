import { Suspense } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { detectCountryFromAcceptLanguage } from '@/lib/openfoodfacts/countries'
import { SnackCardSkeleton } from '@/components/ui/Skeleton'
import { SnackResults } from './SnackResults'
import { PeopleResults } from './PeopleResults'
import { SearchBar } from './SearchBar'
import { SearchFilters } from './SearchFilters'
import Link from 'next/link'

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

function SnackGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <SnackCardSkeleton key={i} />
      ))}
    </div>
  )
}

function PeopleSkeleton() {
  return (
    <div className="flex flex-col gap-3 max-w-xl">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="neo-card h-20 animate-pulse bg-[color:var(--muted)]" />
      ))}
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
  const effectiveCountry = params.country === undefined ? detectedCountry : params.country

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hasFilters = !!(params.categories || params.country || params.ratingMin || params.ratingMax || params.sort)
  const showResults = !!(query || hasFilters)

  const selectedCategories = params.categories ? params.categories.split(',').filter(Boolean) : []

  const paginationParams: Record<string, string> = { tab }
  if (query) paginationParams.q = query
  if (params.categories) paginationParams.categories = params.categories
  if (effectiveCountry) paginationParams.country = effectiveCountry
  if (params.ratingMin) paginationParams.ratingMin = params.ratingMin
  if (params.ratingMax) paginationParams.ratingMax = params.ratingMax
  if (params.sort) paginationParams.sort = params.sort

  // Key changes whenever any search/filter param changes — forces skeleton to re-show
  const resultsKey = [query, params.categories ?? '', effectiveCountry, params.ratingMin ?? '', params.ratingMax ?? '', params.sort ?? '', page].join('|')
  const peopleKey = [query, page].join('|')

  const snacksHref = query ? `/search?q=${encodeURIComponent(query)}` : '/search'
  const peopleHref = query ? `/search?q=${encodeURIComponent(query)}&tab=people` : '/search?tab=people'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Shell — always renders immediately */}
      <div className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Search</h1>
        <Suspense fallback={null}>
          <div className="flex flex-wrap gap-2 items-stretch max-w-3xl">
            <div className="w-full sm:flex-1">
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
            tab === 'snacks' ? 'bg-primary text-ink' : 'bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--muted)]'
          }`}
        >
          Snacks
        </Link>
        <Link
          href={peopleHref}
          className={`px-5 py-2 text-sm font-bold uppercase tracking-wide border-l-2 border-[color:var(--border)] transition-colors ${
            tab === 'people' ? 'bg-primary text-ink' : 'bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--muted)]'
          }`}
        >
          People
        </Link>
      </div>

      {/* Snacks tab */}
      {tab === 'snacks' && (
        !showResults ? (
          <div className="neo-card p-12 text-center">
            <h2 className="font-black text-xl mb-2">Search for a snack</h2>
            <p className="text-[color:var(--text-muted)] text-sm">
              Chips, chocolate, cheese, energy drinks — or use the Filters button to browse by rating, category, or country.
            </p>
          </div>
        ) : (
          <Suspense key={resultsKey} fallback={<SnackGridSkeleton />}>
            <SnackResults
              query={query}
              page={page}
              categories={selectedCategories}
              effectiveCountry={effectiveCountry}
              ratingMin={ratingMin}
              ratingMax={ratingMax}
              sort={params.sort}
              currentUserId={user?.id}
              paginationParams={paginationParams}
            />
          </Suspense>
        )
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
          {query && (
            <Suspense key={peopleKey} fallback={<PeopleSkeleton />}>
              <PeopleResults
                query={query}
                page={page}
                currentUserId={user?.id}
                paginationParams={paginationParams}
              />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}
