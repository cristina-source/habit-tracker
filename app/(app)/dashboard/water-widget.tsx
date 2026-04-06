'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Droplets } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Props {
  initialWater: number
  goal?: number
}

export function WaterWidget({ initialWater, goal = 2.5 }: Props) {
  const [water, setWater] = useState(initialWater)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const pct = Math.min(Math.round((water / goal) * 100), 100)

  const add = async (amount: number) => {
    const next = Math.round((water + amount) * 10) / 10
    setWater(next)
    setLoading(true)
    try {
      await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waterIntake: next }),
      })
      if (next >= goal) toast('Meta de água atingida! 💧', 'success') // [ITERATE v1]
      startTransition(() => router.refresh())
    } catch {
      setWater(water)
      toast('Erro ao registar água', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      gridColumn: '3',
      gridRow: '1',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Água
        </span>
        <Droplets size={14} color="var(--accent2)" />
      </div>

      {/* Value */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
          {water.toFixed(1)} L
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Meta: {goal} L — {pct}% completo
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct >= 100 ? 'var(--success)' : 'var(--accent2)',
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Quick add buttons */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        {[0.25, 0.5].map((amount) => (
          <button
            key={amount}
            onClick={() => add(amount)}
            disabled={loading || pct >= 100}
            style={{
              flex: 1,
              padding: '6px 0',
              background: 'rgba(62,255,200,0.08)',
              border: '1px solid rgba(62,255,200,0.2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent2)',
              fontSize: 11,
              fontWeight: 700,
              cursor: loading || pct >= 100 ? 'not-allowed' : 'pointer',
              opacity: loading || pct >= 100 ? 0.5 : 1,
              transition: 'all var(--ease-fast)',
            }}
            onMouseEnter={(e) => {
              if (!loading && pct < 100) e.currentTarget.style.background = 'rgba(62,255,200,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(62,255,200,0.08)'
            }}
          >
            +{amount === 0.25 ? '250ml' : '500ml'}
          </button>
        ))}
      </div>

      {/* Shimmer when loading */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(62,255,200,0.04) 50%, transparent 100%)',
          animation: 'shimmer 1s linear infinite',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}
