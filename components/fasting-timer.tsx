'use client'

import { useState, useEffect } from 'react'

interface FastingTimerProps {
  startTime: string // ISO string
  protocol: '16:8' | 'OMAD' | '36h'
}

const PROTOCOL_HOURS: Record<string, number> = {
  '16:8': 16,
  OMAD: 23,
  '36h': 36,
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function FastingTimer({ startTime, protocol }: FastingTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  const goalHours = PROTOCOL_HOURS[protocol] ?? 16
  const goalSeconds = goalHours * 3600

  useEffect(() => {
    const start = new Date(startTime).getTime()

    const tick = () => {
      const now = Date.now()
      setElapsed(Math.floor((now - start) / 1000))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60
  const progress = Math.min((elapsed / goalSeconds) * 100, 100)
  const completed = elapsed >= goalSeconds

  const remaining = Math.max(goalSeconds - elapsed, 0)
  const remH = Math.floor(remaining / 3600)
  const remM = Math.floor((remaining % 3600) / 60)
  const remS = remaining % 60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Timer display */}
      <div
        style={{
          fontSize: '52px',
          fontWeight: '700',
          color: completed ? 'var(--accent)' : 'var(--text)',
          letterSpacing: '-2px',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            height: '6px',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: completed
                ? 'var(--accent)'
                : 'linear-gradient(90deg, var(--accent2), var(--accent))',
              borderRadius: '3px',
              transition: 'width 1s linear',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>{Math.round(progress)}% completo</span>
          {!completed && (
            <span>
              Faltam {pad(remH)}:{pad(remM)}:{pad(remS)}
            </span>
          )}
          {completed && <span style={{ color: 'var(--accent)' }}>Meta atingida!</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Meta: <strong style={{ color: 'var(--text)' }}>{goalHours}h</strong> — Protocolo{' '}
          <strong style={{ color: 'var(--accent)' }}>{protocol}</strong>
        </div>
        {!completed && (() => {
          const endTime = new Date(new Date(startTime).getTime() + goalSeconds * 1000)
          const isNextDay = endTime.getDate() !== new Date().getDate()
          return (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Termina às{' '}
              <strong style={{ color: 'var(--text)' }}>
                {endTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}h
              </strong>
              {isNextDay ? ' amanhã' : ' de hoje'}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
