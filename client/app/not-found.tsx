import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="neo-card p-12 text-center max-w-md w-full">
        <div className="text-7xl mb-4">🧀</div>
        <h1 className="text-6xl font-black uppercase tracking-tight mb-2">404</h1>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
          This Snack Has Left the Building
        </h2>
        <p className="text-[color:var(--text-muted)] text-sm mb-8">
          Looks like this page got eaten. Either someone snacked on it, or it never existed
          in the first place. Tragic.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="neo-btn bg-primary text-ink px-6 py-3 font-bold uppercase tracking-wide text-sm">
            Go Home
          </Link>
          <Link href="/search" className="neo-btn bg-[color:var(--surface)] px-6 py-3 font-bold uppercase tracking-wide text-sm">
            Find a Snack
          </Link>
        </div>
      </div>
    </div>
  )
}
