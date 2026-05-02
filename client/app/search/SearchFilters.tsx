'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useRef } from 'react'
import { SlidersHorizontal, X, Check, Search } from 'lucide-react'
import { COUNTRIES } from '@/lib/openfoodfacts/countries'
import { CATEGORIES } from '@/lib/openfoodfacts/categories'

const R_MIN = 1
const R_MAX = 5
const R_STEP = 0.5

export function SearchFilters({ query, defaultCountry = '' }: { query: string; defaultCountry?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const sort = searchParams.get('sort') ?? ''
  const ratingMinParam = searchParams.get('ratingMin') ?? ''
  const ratingMaxParam = searchParams.get('ratingMax') ?? ''
  const rawCountry = searchParams.get('country')
  const country = rawCountry === null ? defaultCountry : rawCountry
  const categoriesParam = searchParams.get('categories') ?? ''
  const selectedCategories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : []

  const [localMin, setLocalMin] = useState(ratingMinParam ? parseFloat(ratingMinParam) : R_MIN)
  const [localMax, setLocalMax] = useState(ratingMaxParam ? parseFloat(ratingMaxParam) : R_MAX)

  useEffect(() => {
    setLocalMin(ratingMinParam ? parseFloat(ratingMinParam) : R_MIN)
    setLocalMax(ratingMaxParam ? parseFloat(ratingMaxParam) : R_MAX)
  }, [ratingMinParam, ratingMaxParam])

  const hasRatingFilter = localMin > R_MIN || localMax < R_MAX

  const activeCount = [
    sort,
    hasRatingFilter ? '1' : '',
    rawCountry ?? '',
    selectedCategories.length > 0 ? '1' : '',
  ].filter(Boolean).length

  const commitRating = useCallback((min: number, max: number) => {
    const p = new URLSearchParams(searchParams.toString())
    if (min > R_MIN) p.set('ratingMin', String(min))
    else p.delete('ratingMin')
    if (max < R_MAX) p.set('ratingMax', String(max))
    else p.delete('ratingMax')
    p.delete('page')
    router.push(`/search?${p}`)
  }, [searchParams, router])

  const update = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    // country: always set (even empty) to distinguish "explicit all" from "auto-detect"
    if (value || key === 'country') p.set(key, value)
    else p.delete(key)
    p.delete('page')
    router.push(`/search?${p}`)
  }, [searchParams, router])

  const toggleCategory = useCallback((val: string) => {
    const next = selectedCategories.includes(val)
      ? selectedCategories.filter((c) => c !== val)
      : [...selectedCategories, val]
    const p = new URLSearchParams(searchParams.toString())
    if (next.length > 0) p.set('categories', next.join(','))
    else p.delete('categories')
    p.delete('page')
    router.push(`/search?${p}`)
  }, [selectedCategories, searchParams, router])

  const filteredCategories = catSearch.trim()
    ? CATEGORIES.filter((c) =>
        c.label.toLowerCase().includes(catSearch.toLowerCase()) ||
        c.group.toLowerCase().includes(catSearch.toLowerCase())
      )
    : CATEGORIES

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', onMouseDown)
      return () => document.removeEventListener('mousedown', onMouseDown)
    }
  }, [isOpen])

  const pctMin = ((localMin - R_MIN) / (R_MAX - R_MIN)) * 100
  const pctMax = ((localMax - R_MIN) / (R_MAX - R_MIN)) * 100

  const thumbCls = `
    absolute inset-0 w-full appearance-none bg-transparent
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
    [&::-webkit-slider-thumb]:bg-[color:var(--surface)]
    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink
    [&::-webkit-slider-thumb]:cursor-pointer
    [&::-webkit-slider-thumb]:shadow-[2px_2px_0_rgba(0,0,0,0.85)]
    [&::-webkit-slider-runnable-track]:bg-transparent
    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-none
    [&::-moz-range-thumb]:bg-[color:var(--surface)]
    [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink
    [&::-moz-range-thumb]:cursor-pointer
    [&::-moz-range-track]:bg-transparent
  `

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`neo-btn flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap h-full ${
          isOpen || activeCount > 0
            ? 'bg-primary text-ink'
            : 'bg-[color:var(--surface)] text-[color:var(--text)]'
        }`}
      >
        <SlidersHorizontal size={14} />
        Filters
        {activeCount > 0 && (
          <span className="bg-ink text-[color:var(--surface)] text-[10px] font-black w-4 h-4 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 neo-card p-5 w-96 max-w-[95vw] shadow-lg">
          <div className="flex flex-col gap-5">

            {/* Sort */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1.5 text-[color:var(--text-muted)]">Sort By</p>
              <div className="flex gap-1 flex-wrap">
                {([
                  { value: '',          label: 'Default'        },
                  { value: 'popular',   label: 'Most Popular'   },
                  { value: 'unpopular', label: 'Least Popular'  },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => update('sort', value)}
                    className={`px-3 h-8 text-xs font-black border-2 border-[color:var(--border)] transition-colors whitespace-nowrap ${
                      sort === value
                        ? 'bg-primary text-ink'
                        : 'bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating range slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-[color:var(--text-muted)]">Rating</p>
                <p className="text-xs font-black tabular-nums">
                  {!hasRatingFilter
                    ? 'Any'
                    : localMin === localMax
                    ? `${localMin}★`
                    : `${localMin}★ – ${localMax}★`}
                </p>
              </div>

              <div className="relative h-5">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-[color:var(--muted)] border-2 border-[color:var(--border)]" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-2 bg-primary pointer-events-none"
                  style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
                />
                <input
                  type="range"
                  min={R_MIN} max={R_MAX} step={R_STEP}
                  value={localMin}
                  onChange={(e) => setLocalMin(Math.min(parseFloat(e.target.value), localMax - R_STEP))}
                  onPointerUp={() => commitRating(localMin, localMax)}
                  className={thumbCls}
                  style={{ zIndex: localMin >= R_MAX - R_STEP ? 5 : 3 }}
                />
                <input
                  type="range"
                  min={R_MIN} max={R_MAX} step={R_STEP}
                  value={localMax}
                  onChange={(e) => setLocalMax(Math.max(parseFloat(e.target.value), localMin + R_STEP))}
                  onPointerUp={() => commitRating(localMin, localMax)}
                  className={thumbCls}
                  style={{ zIndex: 4 }}
                />
              </div>

              <div className="flex justify-between mt-2 px-0.5">
                {[1, 2, 3, 4, 5].map((v) => (
                  <span key={v} className="text-[10px] font-bold text-[color:var(--text-muted)]">{v}★</span>
                ))}
              </div>
            </div>

            {/* Category multiselect */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1.5 text-[color:var(--text-muted)]">
                Category
                {selectedCategories.length > 0 && (
                  <span className="ml-1.5 normal-case font-semibold text-primary">
                    ({selectedCategories.length} selected)
                  </span>
                )}
              </p>

              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedCategories.map((val) => {
                    const opt = CATEGORIES.find((c) => c.value === val)
                    return (
                      <button
                        key={val}
                        onClick={() => toggleCategory(val)}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black bg-primary text-ink border-2 border-[color:var(--border)]"
                      >
                        {opt?.label ?? val}
                        <X size={9} />
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="relative mb-1">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search categories…"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="neo-card pl-7 pr-3 py-1.5 text-xs w-full font-medium bg-[color:var(--surface)] outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="max-h-44 overflow-y-auto flex flex-col border-2 border-[color:var(--border)]">
                {filteredCategories.length === 0 && (
                  <p className="text-xs text-[color:var(--text-muted)] px-3 py-2">No categories found</p>
                )}
                {filteredCategories.map((cat) => {
                  const active = selectedCategories.includes(cat.value)
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-left transition-colors border-b border-[color:var(--border)] last:border-b-0 ${
                        active
                          ? 'bg-primary text-ink'
                          : 'bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--muted)]'
                      }`}
                    >
                      <span className="w-3 flex items-center justify-center shrink-0">
                        {active && <Check size={11} />}
                      </span>
                      <span className="flex-1">{cat.label}</span>
                      <span className={`text-[10px] ${active ? 'text-ink/70' : 'text-[color:var(--text-muted)]'}`}>
                        {cat.group}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Country of origin */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1.5 text-[color:var(--text-muted)]">Country of Origin</p>
              <select
                value={country}
                onChange={(e) => update('country', e.target.value)}
                className="neo-card px-3 py-1.5 text-sm w-full font-medium bg-[color:var(--surface)] outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All countries</option>
                {COUNTRIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Clear all */}
            {activeCount > 0 && (
              <button
                onClick={() => {
                  const p = new URLSearchParams()
                  if (query) p.set('q', query)
                  router.push(`/search?${p}`)
                  setIsOpen(false)
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--text-muted)] hover:text-primary transition-colors"
              >
                <X size={12} />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
