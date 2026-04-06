'use client'

// [ITERATE v1] — Toast container global; renderizado no AppLayout
import { useEffect, useState } from 'react'
import type { ToastType } from '@/lib/toast'

interface ToastItem {
  id: number
  message: string
  type: ToastType
  exiting?: boolean
}

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '✓' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '✕' },
  info:    { bg: 'rgba(100,180,255,0.12)', border: 'rgba(100,180,255,0.3)', icon: 'ℹ' },
}

const typeColors: Record<ToastType, string> = {
  success: 'var(--success)',
  error:   'var(--danger)',
  info:    '#64B4FF',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const { id, message, type } = (e as CustomEvent).detail as ToastItem
      setToasts((prev) => [...prev.slice(-2), { id, message, type }])

      // Auto-dismiss after 3s
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300)
      }, 3000)
    }

    window.addEventListener('app:toast', handler)
    return () => window.removeEventListener('app:toast', handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const s = typeStyles[t.type]
        return (
          <div
            key={t.id}
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              backdropFilter: 'blur(12px)',
              borderRadius: 10,
              padding: '11px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 220,
              maxWidth: 340,
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              opacity: t.exiting ? 0 : 1,
              transform: t.exiting ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.25s ease, transform 0.25s ease',
              animation: 'toast-in 0.2s ease',
            }}
          >
            <span style={{
              width: 20, height: 20,
              borderRadius: '50%',
              background: `${typeColors[t.type]}22`,
              border: `1px solid ${typeColors[t.type]}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: typeColors[t.type],
              flexShrink: 0,
            }}>
              {s.icon}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
              {t.message}
            </span>
          </div>
        )
      })}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
