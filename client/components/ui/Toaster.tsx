'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import type { ToastType } from '@/lib/toast'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error: <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}

const ACCENT: Record<ToastType, string> = {
  success: '#3DEB78',
  error: '#FF4D4D',
  warning: '#FFD700',
  info: '#60a5fa',
}

const DURATION = 4000

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, DURATION)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="neo-card flex items-start gap-3 px-4 py-3 pointer-events-auto min-w-[260px] max-w-[360px] animate-toast-in"
      style={{ borderLeft: `5px solid ${ACCENT[item.type]}` }}
    >
      <span style={{ color: ACCENT[item.type], flexShrink: 0, marginTop: 1 }}>
        {ICONS[item.type]}
      </span>
      <p className="flex-1 text-sm font-semibold leading-snug">{item.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail as ToastItem
      setToasts((prev) => [...prev, detail])
    }
    window.addEventListener('cheddar:toast', handler)
    return () => window.removeEventListener('cheddar:toast', handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-4 z-[200] flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}
