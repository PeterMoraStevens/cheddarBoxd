'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'

export function SearchBar({ defaultValue = '', tab }: { defaultValue?: string; tab?: string }) {
  const [value, setValue] = useState(defaultValue)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    const p = new URLSearchParams(searchParams.toString())
    if (q) p.set('q', q)
    else p.delete('q')
    if (tab) p.set('tab', tab)
    p.delete('page')
    startTransition(() => router.push(`${pathname}?${p}`))
  }

  const placeholder = tab === 'people'
    ? 'Search by name or username…'
    : 'Search snacks, brands, barcodes…'

  return (
    <form onSubmit={handleSubmit} className="flex gap-0 w-full">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="neo-input w-full pl-9 pr-10 py-3 text-sm"
          autoFocus
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('')
              const p = new URLSearchParams(searchParams.toString())
              p.delete('q')
              p.delete('page')
              startTransition(() => router.push(`${pathname}?${p}`))
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="neo-btn bg-primary text-ink px-5 py-3 text-sm font-bold uppercase tracking-wide"
      >
        Search
      </button>
    </form>
  )
}
