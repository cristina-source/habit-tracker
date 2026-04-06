'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Plus } from 'lucide-react'

type TrainingType = 'Força' | 'Pilates' | 'Cardio' | 'Rest'

const TRAINING_TYPES: TrainingType[] = ['Força', 'Pilates', 'Cardio', 'Rest']

const TYPE_COLORS: Record<TrainingType, string> = {
  Força: '#C8FF3E',
  Pilates: '#3EFFC8',
  Cardio: '#3E9FFF',
  Rest: 'rgba(255,255,255,0.3)',
}

const TYPE_EMOJI: Record<TrainingType, string> = {
  Força: '🏋️',
  Pilates: '🧘',
  Cardio: '🏃',
  Rest: '😴',
}

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

interface Session {
  id: string
  type: string
  scheduledAt: string
  completed: boolean
  duration?: number | null
  notes?: string | null
}

interface Props {
  thisWeek: Session[]
  allSessions: { id: string; scheduledAt: string; completed: boolean; type: string }[]
  weekStart: string
}

export function TrainingClient({ thisWeek: initialWeek, allSessions, weekStart: weekStartStr }: Props) {
  const [thisWeek, setThisWeek] = useState(initialWeek)
  const [selectedType, setSelectedType] = useState<TrainingType>('Força')
  const [loading, setLoading] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const weekStart = new Date(weekStartStr)

  const getSessionForDay = (dayIndex: number) => {
    const day = addDays(weekStart, dayIndex)
    return thisWeek.find((s) => isSameDay(new Date(s.scheduledAt), day))
  }

  const scheduleDay = async (dayIndex: number) => {
    const day = addDays(weekStart, dayIndex)
    const existing = getSessionForDay(dayIndex)
    if (existing) return

    setLoading(`schedule-${dayIndex}`)
    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          scheduledAt: day.toISOString(),
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setThisWeek((prev) => [...prev, created])
        startTransition(() => router.refresh())
      }
    } finally {
      setLoading(null)
    }
  }

  const markComplete = async (sessionId: string) => {
    setLoading(`complete-${sessionId}`)
    try {
      const res = await fetch(`/api/training/${sessionId}/complete`, { method: 'POST' })
      if (res.ok) {
        setThisWeek((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, completed: true } : s))
        )
        startTransition(() => router.refresh())
      }
    } finally {
      setLoading(null)
    }
  }

  // Build 4-week heatmap
  const heatmapDays: { date: Date; session: typeof allSessions[0] | null }[] = []
  for (let i = 27; i >= 0; i--) {
    const date = addDays(new Date(), -i)
    const session = allSessions.find((s) => isSameDay(new Date(s.scheduledAt), date)) ?? null
    heatmapDays.push({ date, session })
  }

  // Weekly stats
  const sessionsThisWeek = thisWeek.length
  const completedThisWeek = thisWeek.filter((s) => s.completed).length
  const typeCounts = thisWeek.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as TrainingType | undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Weekly summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Sessões', value: sessionsThisWeek, unit: 'esta semana', color: 'var(--accent)' },
          { label: 'Concluídas', value: completedThisWeek, unit: `de ${sessionsThisWeek}`, color: sessionsThisWeek > 0 && completedThisWeek === sessionsThisWeek ? 'var(--success)' : 'var(--accent)' },
          { label: 'Tipo dominante', value: dominantType ? TYPE_EMOJI[dominantType] + ' ' + dominantType : '—', unit: 'esta semana', color: dominantType ? TYPE_COLORS[dominantType] : 'var(--text-muted)' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 2 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Type selector */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '14px' }}>
          Tipo de Treino
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {TRAINING_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: selectedType === t ? `${TYPE_COLORS[t]}22` : 'var(--surface2)',
                border: `1px solid ${selectedType === t ? TYPE_COLORS[t] + '66' : 'var(--border)'}`,
                borderRadius: '8px',
                color: selectedType === t ? TYPE_COLORS[t] : 'var(--text-muted)',
                fontWeight: selectedType === t ? '600' : '400',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <span>{TYPE_EMOJI[t]}</span>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly grid */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '14px' }}>
          Esta Semana
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {DAYS.map((day, i) => {
            const session = getSessionForDay(i)
            const dayDate = addDays(weekStart, i)
            const isToday = isSameDay(dayDate, new Date())
            const type = session?.type as TrainingType | undefined
            const color = type ? TYPE_COLORS[type] : undefined

            return (
              <div
                key={day}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {day}
                </div>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '10px',
                    background: session
                      ? `${color}22`
                      : 'var(--surface2)',
                    border: `1px solid ${session ? (color ?? 'var(--border)') + '44' : 'var(--border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: session ? 'default' : 'pointer',
                    position: 'relative',
                    minHeight: '60px',
                  }}
                  onClick={() => !session && scheduleDay(i)}
                >
                  {session ? (
                    <>
                      <span style={{ fontSize: '18px' }}>{TYPE_EMOJI[session.type as TrainingType] ?? '🏋️'}</span>
                      <div style={{ fontSize: '10px', color: color, fontWeight: '600', textAlign: 'center' }}>
                        {session.type}
                      </div>
                      {!session.completed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markComplete(session.id) }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'rgba(200,255,62,0.2)',
                            border: '1px solid rgba(200,255,62,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={10} color="#C8FF3E" />
                        </button>
                      )}
                      {session.completed && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'rgba(200,255,62,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={10} color="#C8FF3E" strokeWidth={3} />
                        </div>
                      )}
                    </>
                  ) : (
                    <Plus size={16} color="rgba(255,255,255,0.2)" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4-week heatmap */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '14px' }}>
          Últimas 4 Semanas
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(28, 1fr)',
            gap: '4px',
          }}
        >
          {heatmapDays.map(({ date, session }, i) => {
            const type = session?.type as TrainingType | undefined
            const bg = session?.completed
              ? TYPE_COLORS[type ?? 'Força']
              : session
              ? `${TYPE_COLORS[type ?? 'Força']}44`
              : 'var(--surface2)'
            return (
              <div
                key={i}
                title={`${format(date, 'd MMM', { locale: ptBR })}${session ? ` — ${session.type}${session.completed ? ' ✓' : ''}` : ''}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: '3px',
                  background: bg,
                  border: '1px solid var(--border)',
                }}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          {TRAINING_TYPES.map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: TYPE_COLORS[t],
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{TYPE_EMOJI[t]} {t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
