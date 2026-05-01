import { createClient } from '@/lib/supabase/server'
import type { OFFSearchProduct } from '@/lib/openfoodfacts/client'
import { COUNTRIES } from '@/lib/openfoodfacts/countries'
import { computeImgUrl } from '@/lib/compute-img-url'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']

export interface ProductFilters {
  categories?: string[]
  country?: string
  barcodeWhitelist?: string[]
}

function withFilters<T>(q: T, filters: ProductFilters): T {
  let out = q as unknown as ReturnType<Awaited<ReturnType<typeof createClient>>['from']>
  if (filters.categories && filters.categories.length > 0) {
    const tags = filters.categories.map((c) => `en:${c.toLowerCase().replace(/\s+/g, '-')}`)
    out = out.overlaps('categories_tags', tags)
  }
  if (filters.country) {
    const option = COUNTRIES.find((c) => c.value === filters.country)
    const candidates = option?.candidates ?? [`en:${filters.country}`, filters.country]
    out = out.overlaps('countries', candidates)
  }
  if (filters.barcodeWhitelist) {
    out = out.in('barcode', filters.barcodeWhitelist)
  }
  return out as unknown as T
}

export async function searchLocalProducts(
  query: string,
  page = 1,
  limit = 24,
  filters: ProductFilters = {},
): Promise<{ results: ProductRow[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Whitelist is empty (rating filter applied but nothing matched) — short-circuit
  if (filters.barcodeWhitelist && filters.barcodeWhitelist.length === 0) {
    return { results: [], total: 0 }
  }

  // No text query — just filter + browse
  if (!query) {
    const { data, count } = await withFilters(
      supabase.from('products').select('*', { count: 'exact' }).order('name'),
      filters,
    ).range(from, to)
    return { results: (data ?? []) as ProductRow[], total: count ?? 0 }
  }

  // FTS count (fast, head-only)
  const { count: ftsCount } = await withFilters(
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .textSearch('search_vector', query, { config: 'english', type: 'websearch' }),
    filters,
  )

  if (ftsCount && ftsCount >= 1) {
    const { data } = await withFilters(
      supabase
        .from('products')
        .select('*')
        .textSearch('search_vector', query, { config: 'english', type: 'websearch' }),
      filters,
    ).range(from, to)
    return { results: (data ?? []) as ProductRow[], total: ftsCount }
  }

  // Trigram fallback
  const { data, count } = await withFilters(
    supabase
      .from('products')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      .order('updated_at', { ascending: false }),
    filters,
  ).range(from, to)

  return { results: (data ?? []) as ProductRow[], total: count ?? 0 }
}

export function productRowToSearchProduct(p: ProductRow): OFFSearchProduct {
  const imageUrl = p.image_url ?? computeImgUrl(p.barcode)
  return {
    code: p.barcode,
    product_name: p.name,
    brands: p.brand ?? undefined,
    image_front_url: imageUrl,
    image_front_small_url: imageUrl,
    nutriscore_grade: p.nutriscore_grade ?? undefined,
    nova_group: p.nova_group ?? undefined,
    quantity: p.quantity ?? undefined,
  }
}
