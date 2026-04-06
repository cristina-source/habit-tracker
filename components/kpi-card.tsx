'use client'
import { useEffect, useRef, useState } from 'react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: React.ReactNode
  delta?: string
  deltaPositive?: boolean
  accentColor?: string
  className?: string
  animateValue?: number
  stagger?: number
}

function useCountUp(target: number, duration = 600) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  delta,
  deltaPositive,
  accentColor = 'var(--accent)',
  className = '',
  animateValue,
  stagger = 1,
}: KpiCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const animatedNumber = useCountUp(animateValue ?? 0)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
    }
    card.addEventListener('mousemove', handleMove)
    return () => card.removeEventListener('mousemove', handleMove)
  }, [])

  const displayValue = animateValue !== undefined ? animatedNumber.toString() : value

  return (
    <div
      ref={cardRef}
      className={`stagger-${stagger} ${className}`}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 20px',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'transform var(--ease-base), box-shadow var(--ease-base), border-color var(--ease-base)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.borderColor = 'var(--border-strong)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {/* Flashlight overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.03), transparent 70%)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
        {icon && <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{icon}</span>}
      </div>

      {/* Value */}
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
        {displayValue}
      </div>

      {/* Delta */}
      {delta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: deltaPositive ? 'var(--success)' : 'var(--danger)' }}>
            {deltaPositive ? '↑' : '↓'} {delta}
          </span>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {subtitle}
        </div>
      )}

      {/* Accent bottom line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accentColor}40, transparent)`,
      }} />
    </div>
  )
}
