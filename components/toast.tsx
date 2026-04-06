'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastData {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastItemProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const variantStyles: Record<ToastVariant, { border: string; iconColor: string; bg: string }> = {
  success: { border: 'rgba(16,185,129,0.3)', iconColor: 'var(--success)', bg: 'var(--surface3)' },
  error:   { border: 'rgba(255,77,77,0.3)',  iconColor: 'var(--danger)',  bg: 'var(--surface3)' },
  info:    { border: 'var(--border-strong)', iconColor: 'var(--accent2)', bg: 'var(--surface3)' },
}

const VariantIcon = ({ variant }: { variant: ToastVariant }) => {
  const size = 16
  if (variant === 'success') return <CheckCircle size={size} color="var(--success)" />
  if (variant === 'error')   return <XCircle     size={size} color="var(--danger)"  />
  return <Info size={size} color="var(--accent2)" />
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false)
  const styles = variantStyles[toast.variant]

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))

    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: 260,
        maxWidth: 380,
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 280ms ease',
        pointerEvents: 'auto',
      }}
    >
      <VariantIcon variant={toast.variant} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onDismiss(toast.id), 300)
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          borderRadius: 4,
          transition: 'color var(--ease-fast)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
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
      aria-live="polite"
      aria-label="Notificações"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
