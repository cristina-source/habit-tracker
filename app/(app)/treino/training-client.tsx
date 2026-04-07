'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Plus, X, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

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
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completionForm, setCompletionForm] = useState({ duration: '', notes: '' })
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [, startTransition] = useTransition()
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
        body: JSON.stringify({ type: selectedType, scheduledAt: day.toISOString() }),
      })
      if (res.ok) {
        const created = await res.json()
        setThisWeek((prev) => [...prev, created])
        toast(`${TYPE_EMOJI[selectedType]} ${selectedType} agendado`, 'success')
        startTransition(() => router.refresh())
      } else {
        toast('Erro ao agendar treino', 'error')
      }
    } catch {
      toast('Erro de ligação', 'error')
    } finally {
      setLoading(null)
    }
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(`delete-${sessionId}`)
    try {
      const res = await fetch(`/api/training/${sessionId}`, { method: 'DELETE' })
      if (res.ok) {
        setThisWeek((prev) => prev.filter((s) => s.id !== sessionId))
        toast('Sessão removida', 'info')
        startTransition(() => router.refresh())
      } else {
        toast('Erro ao remover sessão', 'error')
      }
    } catch {
      toast('Erro de ligação', 'error')
    } finally {
      setLoading(null)
    }
  }

  const markComplete = async (sessionId: string) => {
    setLoading(`complete-${sessionId}`)
    try {
      const body: { duration?: number; notes?: string } = {}
      if (completionForm.duration) body.duration = parseInt(completionForm.duration)
      if (completionForm.notes.trim()) body.notes = completionForm.notes.trim()

      const res = await fetch(`/api/training/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        setThisWeek((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, completed: true, duration: updated.duration, notes: updated.notes } : s))
        )
        setCompletingId(null)
        setCompletionForm({ duration: '', notes: '' })
        toast('Treino concluído! 💪', 'success')
        startTransition(() => router.refresh())
      } else {
        toast('Erro ao marcar como concluído', 'error')
      }
    } catch {
      toast('Erro de ligação', 'error')
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
          {
            label: 'Concluídas', value: completedThisWeek, unit: `de ${sessionsThisWeek}`,
            color: sessionsThisWeek > 0 && completedThisWeek === sessionsThisWeek ? 'var(--success)' : 'var(--accent)',
          },
          {
            label: 'Foco', value: dominantType ? TYPE_EMOJI[dominantType] + ' ' + dominantType : '—',
            unit: 'tipo dominante', color: dominantType ? TYPE_COLORS[dominantType] : 'var(--text-muted)',
          },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Planner — type selector + weekly grid in one card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header + instructions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: 4 }}>
              Plano da Semana
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Selecciona o tipo abaixo e clica num dia vazio para agendar
            </p>
          </div>
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TRAINING_TYPES.map((t) => {
            const isSelected = selectedType === t
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px',
                  background: isSelected ? `${TYPE_COLORS[t]}22` : 'var(--surface2)',
                  border: `2px solid ${isSelected ? TYPE_COLORS[t] + '88' : 'var(--border)'}`,
                  borderRadius: '8px',
                  color: isSelected ? TYPE_COLORS[t] : 'var(--text-muted)',
                  fontWeight: isSelected ? '700' : '400',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: isSelected ? `0px solid ${TYPE_COLORS[t]}` : 'none',
                  boxShadow: isSelected ? `0 0 0 1px ${TYPE_COLORS[t]}33` : 'none',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = `${TYPE_COLORS[t]}44`
                    e.currentTarget.style.color = TYPE_COLORS[t]
                    e.currentTarget.style.background = `${TYPE_COLORS[t]}0D`
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.background = 'var(--surface2)'
                  }
                }}
              >
                <span>{TYPE_EMOJI[t]}</span>
                {t}
              </button>
            )
          })}
        </div>

        {/* Weekly grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {DAYS.map((day, i) => {
            const session = getSessionForDay(i)
            const dayDate = addDays(weekStart, i)
            const isToday = isSameDay(dayDate, new Date())
            const isPast = dayDate < new Date() && !isToday
            const type = session?.type as TrainingType | undefined
            const color = type ? TYPE_COLORS[type] : TYPE_COLORS[selectedType]
            const isLoadingSchedule = loading === `schedule-${i}`
            const isLoadingDelete = session && loading === `delete-${session.id}`
            const isHovered = hoveredDay === i && !session

            return (
              <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                {/* Day label */}
                <div style={{
                  fontSize: '11px', fontWeight: '600',
                  color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {day}
                </div>

                {/* Day number */}
                <div style={{ fontSize: '10px', color: isToday ? 'var(--accent)' : 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' }}>
                  {format(dayDate, 'd')}
                </div>

                {/* Cell */}
                <div
                  role={!session ? 'button' : undefined}
                  aria-label={!session ? `Agendar ${selectedType} ${day}` : undefined}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '10px',
                    background: session
                      ? session.completed ? `${TYPE_COLORS[type ?? 'Força']}28` : `${TYPE_COLORS[type ?? 'Força']}18`
                      : isHovered
                        ? `${color}15`
                        : isLoadingSchedule
                          ? `${color}10`
                          : 'var(--surface2)',
                    border: session
                      ? `2px solid ${TYPE_COLORS[type ?? 'Força']}${session.completed ? '66' : '44'}`
                      : isHovered
                        ? `2px dashed ${color}77`
                        : `2px dashed ${isPast ? 'rgba(255,255,255,0.06)' : 'var(--border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: session ? 'default' : isLoadingSchedule ? 'wait' : 'pointer',
                    position: 'relative',
                    minHeight: '64px',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => !session && !isLoadingSchedule && scheduleDay(i)}
                  onMouseEnter={() => !session && setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Loading spinner for scheduling */}
                  {isLoadingSchedule && (
                    <div style={{ width: 20, height: 20, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  )}

                  {/* Loading spinner for delete */}
                  {isLoadingDelete && !isLoadingSchedule && (
                    <div style={{ width: 20, height: 20, border: '2px solid rgba(255,77,77,0.3)', borderTopColor: 'var(--danger)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  )}

                  {/* Session content */}
                  {session && !isLoadingDelete && (
                    <>
                      <span style={{ fontSize: '18px', lineHeight: 1 }}>{TYPE_EMOJI[session.type as TrainingType] ?? '🏋️'}</span>
                      <div style={{ fontSize: '9px', color: TYPE_COLORS[type ?? 'Força'], fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {session.type}
                      </div>
                      {session.completed && (
                        <div style={{ fontSize: '9px', color: 'var(--success)', fontWeight: 600 }}>✓ Feito</div>
                      )}

                      {/* Complete button — top right */}
                      {!session.completed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setCompletingId(session.id); setCompletionForm({ duration: '', notes: '' }) }}
                          title="Marcar como concluído"
                          style={{
                            position: 'absolute', top: 3, right: 3,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'rgba(200,255,62,0.15)',
                            border: '1px solid rgba(200,255,62,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,255,62,0.3)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,255,62,0.15)' }}
                        >
                          <Check size={10} color="#C8FF3E" strokeWidth={2.5} />
                        </button>
                      )}

                      {/* Delete button — top left */}
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        title="Remover sessão"
                        style={{
                          position: 'absolute', top: 3, left: 3,
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'transparent',
                          border: '1px solid transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', opacity: 0,
                          transition: 'all 0.15s',
                        }}
                        className="session-delete-btn"
                      >
                        <X size={10} color="var(--danger)" />
                      </button>
                    </>
                  )}

                  {/* Empty cell hover state */}
                  {!session && !isLoadingSchedule && (
                    isHovered
                      ? <Plus size={16} color={color} strokeWidth={2.5} />
                      : <Plus size={14} color={isPast ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, border: '2px dashed rgba(255,255,255,0.2)' }} />
            Vazio — clica para agendar
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={11} color="var(--success)" />
            Concluído
          </div>
        </div>
      </div>

      {/* Hover show delete style */}
      <style>{`
        div:hover .session-delete-btn {
          opacity: 1 !important;
          background: rgba(255,77,77,0.12) !important;
          border-color: rgba(255,77,77,0.3) !important;
        }
      `}</style>

      {/* Inline completion form */}
      {completingId && (() => {
        const sess = thisWeek.find(s => s.id === completingId)
        return sess ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid rgba(200,255,62,0.3)',
            borderRadius: 12, padding: '20px',
            animation: 'fadeInUp 0.2s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>{TYPE_EMOJI[sess.type as TrainingType]}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Concluir {sess.type}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Regista os detalhes da sessão (opcional)</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Duração (min)</label>
                <input
                  type="number"
                  value={completionForm.duration}
                  onChange={e => setCompletionForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="60"
                  min={1}
                  max={480}
                  style={{ width: '100%', fontSize: 13 }}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Notas</label>
                <input
                  type="text"
                  value={completionForm.notes}
                  onChange={e => setCompletionForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="PR no squat 100kg…"
                  style={{ width: '100%', fontSize: 13 }}
                  onKeyDown={e => e.key === 'Enter' && markComplete(completingId)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setCompletingId(null); setCompletionForm({ duration: '', notes: '' }) }}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => markComplete(completingId)}
                disabled={loading === `complete-${completingId}`}
                style={{
                  fontSize: 12, fontWeight: 600, color: '#0A0A0C', background: 'var(--accent)',
                  border: 'none', borderRadius: 7, padding: '7px 16px', cursor: 'pointer',
                  opacity: loading === `complete-${completingId}` ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {loading === `complete-${completingId}` ? (
                  <div style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0A0A0C', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <Check size={13} strokeWidth={3} />
                )}
                Marcar como Concluído
              </button>
            </div>
          </div>
        ) : null
      })()}

      {/* 4-week heatmap */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '14px' }}>
          Últimas 4 Semanas
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(28, 1fr)', gap: '4px' }}>
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
                title={`${format(date, 'd MMM', { locale: ptBR })}${session ? ` — ${session.type}${session.completed ? ' ✓' : ' (por concluir)'}` : ''}`}
                style={{ aspectRatio: '1', borderRadius: '3px', background: bg, border: '1px solid var(--border)' }}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          {TRAINING_TYPES.map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: TYPE_COLORS[t] }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{TYPE_EMOJI[t]} {t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
