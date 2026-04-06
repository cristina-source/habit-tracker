'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus, Trash2, Flame, Droplets, Dumbbell, Brain, Clock, Snowflake, Pencil } from 'lucide-react'
import { toast } from '@/lib/toast'

const CATEGORIES = ['Jejum', 'Nutrição', 'Hidratação', 'Treino', 'Eliminação', 'Outro']
const COLORS = ['#C8FF3E', '#3EFFC8', '#3E9FFF', '#FF9F3E', '#FF3E9F', '#9F3EFF']

interface Habit {
  id: string
  name: string
  category: string
  color: string
  streak: number
  bestStreak: number
  type: string
  target: number | null
  unit: string | null
  isActive: boolean
}

interface Props {
  habits: Habit[]
  completedIds: string[]
  frozenTodayIds: string[]
  freezeCountByHabit: Record<string, number>
  weekCompletionsByHabit: Record<string, string[]> // [ITERATE v2]
}

const SUGGESTED = [
  {
    category: 'Jejum',
    icon: <Clock size={15} />,
    color: '#C8FF3E',
    habits: ['Completar jejum 16:8', 'Janela alimentar ≤ 8h', 'Sem snacks após 20h'],
  },
  {
    category: 'Hidratação',
    icon: <Droplets size={15} />,
    color: '#3EFFC8',
    habits: ['Beber 2.5L de água', 'Copo de água ao acordar', 'Sem bebidas açucaradas'],
  },
  {
    category: 'Treino',
    icon: <Dumbbell size={15} />,
    color: '#3E9FFF',
    habits: ['Treino de força', '10 000 passos', 'Alongamentos 10min'],
  },
  {
    category: 'Eliminação',
    icon: <Brain size={15} />,
    color: '#FF9F3E',
    habits: ['Zero álcool', 'Zero açúcar refinado', 'Zero redes sociais antes das 10h'],
  },
]

function HabitsEmptyState({ onCreate }: { onCreate: (name: string, category: string, color: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero empty message */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '40px 32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent-dim)', border: '1px solid rgba(200,255,62,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          ◆
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Ainda sem hábitos criados.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Os teus hábitos diários definem quem te tornas.<br />Começa por adicionar pelo menos 3 hábitos abaixo.
          </p>
        </div>
      </div>

      {/* Suggested habits */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Hábitos sugeridos — clica para adicionar
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {SUGGESTED.map(({ category, icon, color, habits }) => (
            <div key={category} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                }}>
                  {icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
                  {category}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {habits.map(name => (
                  <button
                    key={name}
                    onClick={() => onCreate(name, category, color)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border)',
                      borderRadius: 7,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `${color}12`
                      e.currentTarget.style.borderColor = `${color}40`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    <Plus size={12} color={color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HabitsList({ habits: initialHabits, completedIds: initialCompletedIds, frozenTodayIds, freezeCountByHabit, weekCompletionsByHabit }: Props) {
  const [habits, setHabits] = useState(initialHabits)
  const [completedIds, setCompletedIds] = useState(new Set(initialCompletedIds))
  const [frozenIds, setFrozenIds] = useState(new Set(frozenTodayIds))
  const [freezeCounts, setFreezeCounts] = useState(freezeCountByHabit)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null) // [ITERATE v1] — habit edit
  const [editDraft, setEditDraft] = useState({ name: '', category: 'Outro', color: '#C8FF3E' })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [newHabit, setNewHabit] = useState({
    name: '',
    category: 'Outro',
    color: '#C8FF3E',
    type: 'toggle',
    target: '',
    unit: '',
  })

  // [ITERATE v2] — Gerar dots dos últimos 7 dias para um hábito
  const getWeekDots = (habitId: string, habitColor: string) => {
    const completedDates = new Set(weekCompletionsByHabit[habitId] ?? [])
    const dots = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      const done = completedDates.has(iso)
      const isToday = i === 0
      dots.push(
        <div
          key={i}
          title={done ? 'Concluído' : isToday ? 'Hoje' : 'Não concluído'}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: done ? habitColor : isToday ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
            border: isToday && !done ? '1px solid rgba(255,255,255,0.2)' : 'none',
            flexShrink: 0,
          }}
        />
      )
    }
    return dots
  }

  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const list = habits.filter((h) => h.category === cat)
      if (list.length > 0) acc[cat] = list
      return acc
    },
    {} as Record<string, Habit[]>
  )

  const toggle = async (habitId: string) => {
    const wasDone = completedIds.has(habitId)
    // [ITERATE v1] — Optimistic update antes do fetch
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(habitId)) next.delete(habitId)
      else next.add(habitId)
      return next
    })
    try {
      await fetch(`/api/habits/${habitId}/complete`, { method: 'POST' })
      toast(wasDone ? 'Hábito desmarcado' : 'Hábito concluído! 🎯', wasDone ? 'info' : 'success')
      startTransition(() => router.refresh())
    } catch {
      // Reverter optimistic update em caso de erro
      setCompletedIds((prev) => {
        const next = new Set(prev)
        if (wasDone) next.add(habitId)
        else next.delete(habitId)
        return next
      })
      toast('Erro ao actualizar hábito', 'error')
    }
  }

  const createHabit = async () => {
    if (!newHabit.name.trim()) return
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newHabit.name,
          category: newHabit.category,
          color: newHabit.color,
          type: newHabit.type,
          target: newHabit.target ? parseFloat(newHabit.target) : null,
          unit: newHabit.unit || null,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setHabits((prev) => [...prev, created])
        setNewHabit({ name: '', category: 'Outro', color: '#C8FF3E', type: 'toggle', target: '', unit: '' })
        setShowForm(false)
        toast(`Hábito "${created.name}" criado`, 'success') // [ITERATE v1]
        startTransition(() => router.refresh())
      }
    } catch {
      toast('Erro ao criar hábito', 'error')
    }
  }

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Eliminar este hábito?')) return
    try {
      await fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
      setHabits((prev) => prev.filter((h) => h.id !== habitId))
      toast('Hábito eliminado', 'info') // [ITERATE v1]
    } catch {
      toast('Erro ao eliminar hábito', 'error')
    }
  }

  const freezeHabit = async (habitId: string) => {
    const currentCount = freezeCounts[habitId] ?? 0
    const isFrozen = frozenIds.has(habitId)
    if (!isFrozen && currentCount >= 2) {
      alert('Limite de 2 freezes por mês atingido para este hábito.')
      return
    }
    try {
      const res = await fetch(`/api/habits/${habitId}/freeze`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setFrozenIds((prev) => {
          const next = new Set(prev)
          if (data.frozen) next.add(habitId)
          else next.delete(habitId)
          return next
        })
        setFreezeCounts((prev) => ({
          ...prev,
          [habitId]: data.frozen ? (prev[habitId] ?? 0) + 1 : Math.max(0, (prev[habitId] ?? 1) - 1),
        }))
        toast(data.frozen ? 'Streak congelado para hoje ❄️' : 'Freeze removido', data.frozen ? 'info' : 'info') // [ITERATE v1]
      } else {
        const err = await res.json()
        toast(err.error, 'error')
      }
    } catch {
      // silent
    }
  }

  // [ITERATE v1] — Guardar edição de hábito
  const startEdit = (habit: Habit) => {
    setEditingId(habit.id)
    setEditDraft({ name: habit.name, category: habit.category, color: habit.color })
  }

  const saveEdit = async () => {
    if (!editingId || !editDraft.name.trim()) return
    try {
      const res = await fetch(`/api/habits/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      if (res.ok) {
        const updated = await res.json()
        setHabits((prev) => prev.map((h) => (h.id === editingId ? { ...h, ...updated } : h)))
        toast('Hábito actualizado', 'success')
        setEditingId(null)
        startTransition(() => router.refresh())
      }
    } catch {
      toast('Erro ao guardar alterações', 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Add habit button */}
      <button
        onClick={() => setShowForm((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: showForm ? 'var(--surface2)' : 'var(--accent)',
          color: showForm ? 'var(--text)' : '#0A0A0C',
          border: 'none',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        <Plus size={16} />
        {showForm ? 'Cancelar' : 'Novo Hábito'}
      </button>

      {/* Add habit form */}
      {showForm && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Criar Hábito</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>Nome</label>
              <input
                value={newHabit.name}
                onChange={(e) => setNewHabit((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Beber 2.5L de água"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>Categoria</label>
              <select
                value={newHabit.category}
                onChange={(e) => setNewHabit((p) => ({ ...p, category: e.target.value }))}
                style={{ width: '100%' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>Cor</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewHabit((p) => ({ ...p, color: c }))}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c,
                    border: newHabit.color === c ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={createHabit}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: '#0A0A0C',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            Guardar Hábito
          </button>
        </div>
      )}

      {/* Habits grouped by category */}
      {habits.length === 0 ? (
        <HabitsEmptyState onCreate={(name, category, color) => {
          setNewHabit(p => ({ ...p, name, category, color }))
          // auto-create the suggested habit
          fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, color, type: 'toggle', target: null, unit: null }),
          }).then(r => r.json()).then(created => {
            setHabits(prev => [...prev, created])
            startTransition(() => router.refresh())
          }).catch(() => {})
        }} />
      ) : (
        Object.entries(grouped).map(([category, catHabits]) => (
          <div key={category}>
            <h3
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '10px',
              }}
            >
              {category}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {catHabits.map((habit) => {
                const done = completedIds.has(habit.id)
                const frozen = frozenIds.has(habit.id)
                const freezeCount = freezeCounts[habit.id] ?? 0
                return (
                  <div key={habit.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${frozen ? 'rgba(100,180,255,0.25)' : done ? 'rgba(200,255,62,0.15)' : 'var(--border)'}`,
                      borderRadius: editingId === habit.id ? '10px 10px 0 0' : '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => toggle(habit.id)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: `2px solid ${done ? habit.color : 'rgba(255,255,255,0.2)'}`,
                        background: done ? habit.color : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {done && <Check size={14} color="#0A0A0C" strokeWidth={3} />}
                    </button>

                    {/* Habit info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: done ? 'var(--text-muted)' : 'var(--text)',
                          textDecoration: done ? 'line-through' : 'none',
                        }}
                      >
                        {habit.name}
                      </div>
                    </div>

                    {/* 7-day dots — [ITERATE v2] */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {getWeekDots(habit.id, habit.color)}
                    </div>

                    {/* Streak */}
                    {habit.streak > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>
                        <Flame size={13} />
                        {habit.streak}
                      </div>
                    )}

                    {/* Best streak */}
                    {habit.bestStreak > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Melhor: {habit.bestStreak}
                      </div>
                    )}

                    {/* Freeze */}
                    <button
                      onClick={() => freezeHabit(habit.id)}
                      title={frozen ? 'Remover freeze de hoje' : `Congelar streak hoje (${freezeCount}/2 este mês)`}
                      style={{
                        background: frozen ? 'rgba(100,180,255,0.12)' : 'none',
                        border: frozen ? '1px solid rgba(100,180,255,0.3)' : '1px solid transparent',
                        color: frozen ? '#64B4FF' : freezeCount >= 2 ? 'var(--text-disabled)' : 'var(--text-muted)',
                        cursor: freezeCount >= 2 && !frozen ? 'not-allowed' : 'pointer',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Snowflake size={13} />
                      {freezeCount > 0 && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{freezeCount}/2</span>}
                    </button>

                    {/* Edit — [ITERATE v1] */}
                    <button
                      onClick={() => editingId === habit.id ? setEditingId(null) : startEdit(habit)}
                      title="Editar hábito"
                      style={{
                        background: editingId === habit.id ? 'var(--surface2)' : 'none',
                        border: 'none',
                        color: editingId === habit.id ? 'var(--accent)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Pencil size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Inline edit form — [ITERATE v1] */}
                  {editingId === habit.id && (
                    <div style={{
                      padding: '14px 16px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderTop: 'none',
                      borderRadius: '0 0 10px 10px',
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Nome</label>
                          <input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                            style={{ fontSize: 13, padding: '6px 10px' }}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            autoFocus
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Categoria</label>
                          <select
                            value={editDraft.category}
                            onChange={(e) => setEditDraft((p) => ({ ...p, category: e.target.value }))}
                            style={{ fontSize: 13, padding: '6px 10px' }}
                          >
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditDraft((p) => ({ ...p, color: c }))}
                            style={{
                              width: 22, height: 22, borderRadius: '50%', background: c,
                              border: editDraft.color === c ? '2px solid white' : '2px solid transparent',
                              cursor: 'pointer', flexShrink: 0,
                            }}
                          />
                        ))}
                        <div style={{ flex: 1 }} />
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding: '6px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveEdit}
                          style={{ padding: '6px 14px', background: 'var(--accent)', color: '#0A0A0C', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
