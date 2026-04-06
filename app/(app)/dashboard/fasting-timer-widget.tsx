'use client'

import { useState, useEffect } from 'react'

interface Props {
  startTime: string
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

export function FastingTimerWidget({ startTime, protocol }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const goalHours = PROTOCOL_HOURS[protocol] ?? 16
  const goalSeconds = goalHours * 3600

  useEffect(() => {
    const start = new Date(startTime).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const pct = Math.min((elapsed / goalSeconds) * 100, 100)

  return (
    <div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: '700',
          color: 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.5px',
        }}
      >
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
      <div
        style={{
          marginTop: '8px',
          height: '4px',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--accent)',
            borderRadius: '2px',
            transition: 'width 1s linear',
          }}
        />
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        {Math.round(pct)}% — Protocolo {protocol}
      </div>
    </div>
  )
}
