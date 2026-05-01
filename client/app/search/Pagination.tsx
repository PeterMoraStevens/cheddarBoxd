import Link from 'next/link'

function pageHref(params: Record<string, string>, page: number) {
  const p = new URLSearchParams(params)
  if (page > 1) p.set('page', String(page))
  else p.delete('page')
  return `/search?${p}`
}

export function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number
  totalPages: number
  params: Record<string, string>
}) {
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
