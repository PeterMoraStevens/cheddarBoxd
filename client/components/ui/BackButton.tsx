'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1 text-sm font-semibold text-[color:var(--text-muted)] hover:text-primary transition-colors"
    >
      <ChevronLeft size={16} />
      {label}
    </button>
  )
}
