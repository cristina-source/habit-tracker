// [ITERATE v1] — Toast singleton via CustomEvent (sem dependências externas)
export type ToastType = 'success' | 'error' | 'info'

export function toast(message: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: { message, type, id: Date.now() + Math.random() },
    })
  )
}
