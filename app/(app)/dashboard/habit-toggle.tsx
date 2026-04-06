'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

interface Habit {
  id: string
  name: string
  category: string
  color: string
  streak: number
  type: string
}

interface Props {
  habit: Habit
  completed: boolean
}

// Map common category names to badge colors
function getCategoryBadgeStyle(category: string) {
  const lower = category.toLowerCase()
  if (lower.includes('saúde') || lower.includes('saude') || lower.includes('health'))
    return { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.2)' }
  if (lower.includes('treino') || lower.includes('fitness') || lower.includes('exerc'))
    return { bg: 'rgba(200,255,62,0.1)', color: '#C8FF3E', border: 'rgba(200,255,62,0.2)' }
  if (lower.includes('nutri') || lower.includes('alimenta') || lower.includes('agua') || lower.includes('água'))
    return { bg: 'rgba(62,255,200,0.1)', color: '#3EFFC8', border: 'rgba(62,255,200,0.2)' }
  if (lower.includes('ment') || lower.includes('medita') || lower.includes('leitura'))
    return { bg: 'rgba(255,184,0,0.1)', color: '#FFB800', border: 'rgba(255,184,0,0.2)' }
  return { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: 'var(--border)' }
}

export function HabitToggle({ habit, completed: initialCompleted }: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const router = useRouter()

  const badge = getCategoryBadgeStyle(habit.category)

  const toggle = async () => {
    if (loading) return

    // [ITERATE v4] — Optimistic update: flip state immediately, rollback on error
    const prev = completed
    const willComplete = !prev
    setCompleted(willComplete)
    if (willComplete) {
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 600)
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/habits/${habit.id}/complete`, { method: 'POST' })
      if (!res.ok) {
        setCompleted(prev) // rollback
      } else {
        router.refresh()
      }
    } catch {
      setCompleted(prev) // rollback on network error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${habit.name} — ${completed ? 'completo, clica para desfazer' : 'por completar, clica para marcar'}`}
      aria-pressed={completed}
      style={{
        background: completed ? 'rgba(200,255,62,0.03)' : 'var(--surface)',
        border: `1px solid ${completed ? 'rgba(200,255,62,0.12)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all var(--ease-base)',
        userSelect: 'none',
        outline: 'none',
      }}
      onClick={toggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }} // [ITERATE v4] — keyboard support
      onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent)' }}
      onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
      onMouseEnter={e => {
        if (!completed) {
          e.currentTarget.style.borderColor = 'var(--border-strong)'
          e.currentTarget.style.background = 'var(--surface2)'
        }
      }}
      onMouseLeave={e => {
        if (!completed) {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.background = 'var(--surface)'
        }
      }}
    >
      {/* Animated checkbox */}
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '6px',
          border: `2px solid ${completed ? habit.color || 'var(--accent)' : 'rgba(255,255,255,0.18)'}`,
          background: completed ? (habit.color || 'var(--accent)') : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--ease-bounce)',
          transform: justCompleted ? 'scale(1.25)' : 'scale(1)',
          boxShadow: completed ? `0 0 10px ${habit.color || 'var(--accent)'}40` : 'none',
        }}
      >
        {completed && (
          <div style={{
            animation: justCompleted ? 'scaleIn 200ms var(--ease-bounce) both' : 'none',
          }}>
            <Check size={13} color="#0A0A0C" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Color dot + name */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Category color dot */}
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: habit.color || 'var(--accent)',
          flexShrink: 0,
          opacity: completed ? 0.4 : 0.8,
          transition: 'opacity var(--ease-base)',
        }} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: completed ? 'var(--text-muted)' : 'var(--text)',
              textDecoration: completed ? 'line-through' : 'none',
              textDecorationColor: 'rgba(255,255,255,0.2)',
              transition: 'color var(--ease-base), text-decoration var(--ease-base)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {habit.name}
          </div>
          {/* Category badge */}
          <span style={{
            display: 'inline-block',
            marginTop: 2,
            fontSize: 10,
            fontWeight: 600,
            color: badge.color,
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            borderRadius: 99,
            padding: '1px 7px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {habit.category}
          </span>
        </div>
      </div>

      {/* Streak badge */}
      {habit.streak > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--warning)',
          background: 'var(--warning-bg)',
          border: '1px solid rgba(255,184,0,0.2)',
          borderRadius: 99,
          padding: '3px 8px',
          flexShrink: 0,
        }}>
          <span>🔥</span>
          <span>{habit.streak}</span>
        </div>
      )}

      {/* Spinner */}
      {loading && (
        <div
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      )}
    </div>
  )
}
