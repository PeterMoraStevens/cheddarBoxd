export type ToastType = 'success' | 'error' | 'info' | 'warning'

export function toast(message: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('cheddar:toast', {
      detail: { id: Date.now() + Math.random(), message, type },
    })
  )
}
