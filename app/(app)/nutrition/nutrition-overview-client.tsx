'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, UtensilsCrossed, BookOpen, CalendarDays, Sparkles, Settings2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import NextLink from 'next/link'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'post-workout']
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Pequeno-almoco',
  lunch: 'Almoco',
  dinner: 'Jantar',
  snack: 'Snack',
  'post-workout': 'Pos-treino',
}
const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
  'post-workout': '💪',
}

interface MealLog {
  id: string
  mealName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: string
  loggedAt: string
}

interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface DayData {
  date: string
  label: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Props {
  logs: MealLog[]
  today: string
  savedRecipesCount: number
  goals: NutritionGoals
  weekData: DayData[]
}

function MacroRing({ value, goal, color, label, unit = 'g' }: { value: number; goal: number; color: string; label: string; unit?: string }) {
  const pct = Math.min((value / goal) * 100, 100)
  const r = 32
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const over = value > goal
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
        <circle
          cx={40} cy={40} r={r} fill="none"
          stroke={over ? 'var(--warning)' : color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={40} y={38} textAnchor="middle" fill="var(--text)" fontSize={14} fontWeight={700}>
          {Math.round(value)}
        </text>
        <text x={40} y={52} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>
          {Math.round(pct)}%
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{unit === 'kcal' ? `/ ${goal} kcal` : `/ ${goal}g`}</div>
      </div>
    </div>
  )
}

function CalorieBar({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min((value / goal) * 100, 100)
  const remaining = Math.max(goal - value, 0)
  const over = value > goal
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {goal} kcal</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: over ? 'var(--warning)' : 'var(--success)' }}>
          {over ? `+${Math.round(value - goal)} kcal` : `${Math.round(remaining)} restantes`}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          background: over
            ? 'linear-gradient(90deg, var(--accent), var(--warning))'
            : 'linear-gradient(90deg, var(--accent), var(--accent2))',
          width: `${pct}%`,
          borderRadius: 99,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function WeekChart({ data, goal }: { data: DayData[]; goal: number }) {
  const maxVal = Math.max(goal, ...data.map(d => d.calories)) * 1.1
  const barWidth = 100 / data.length

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Ultimos 7 dias</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Media: {Math.round(data.reduce((s, d) => s + d.calories, 0) / Math.max(data.filter(d => d.calories > 0).length, 1))} kcal
        </span>
      </div>
      <div style={{ position: 'relative', height: 120 }}>
        {/* Goal line */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          bottom: `${(goal / maxVal) * 100}%`,
          borderBottom: '1px dashed var(--text-disabled)',
          zIndex: 1,
        }}>
          <span style={{
            position: 'absolute', right: 0, top: -14,
            fontSize: 9, color: 'var(--text-disabled)',
          }}>{goal}</span>
        </div>
        {/* Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 6 }}>
          {data.map((d, i) => {
            const h = d.calories > 0 ? Math.max((d.calories / maxVal) * 100, 3) : 0
            const isToday = i === data.length - 1
            const over = d.calories > goal
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                {d.calories > 0 && (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {d.calories}
                  </span>
                )}
                <div style={{
                  width: '100%', maxWidth: 32,
                  height: `${h}%`, minHeight: d.calories > 0 ? 4 : 0,
                  background: over
                    ? 'linear-gradient(to top, var(--warning), #f97316)'
                    : isToday
                      ? 'linear-gradient(to top, var(--accent), var(--accent2))'
                      : 'var(--accent)',
                  borderRadius: '4px 4px 2px 2px',
                  opacity: isToday ? 1 : 0.6,
                  transition: 'height 0.4s ease',
                }} />
              </div>
            )
          })}
        </div>
      </div>
      {/* Labels */}
      <div style={{ display: 'flex', marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={d.date} style={{
            flex: 1, textAlign: 'center',
            fontSize: 10, fontWeight: i === data.length - 1 ? 700 : 400,
            color: i === data.length - 1 ? 'var(--accent)' : 'var(--text-muted)',
            textTransform: 'capitalize',
          }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function NutritionOverviewClient({ logs: initialLogs, today, savedRecipesCount, goals: initialGoals, weekData }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [showForm, setShowForm] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [goals, setGoals] = useState(initialGoals)
  const [goalsForm, setGoalsForm] = useState(initialGoals)
  const [savingGoals, setSavingGoals] = useState(false)
  const [form, setForm] = useState({ mealName: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'lunch' })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const GOALS = goals

  const saveGoals = async () => {
    setSavingGoals(true)
    try {
      const res = await fetch('/api/nutrition/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalsForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setGoals(updated)
        setShowGoals(false)
        toast('Metas actualizadas', 'success')
        router.refresh()
      }
    } catch { toast('Erro ao guardar metas', 'error') }
    finally { setSavingGoals(false) }
  }

  const totals = logs.reduce(
    (acc, l) => ({ calories: acc.calories + l.calories, protein: acc.protein + l.protein, carbs: acc.carbs + l.carbs, fat: acc.fat + l.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const addLog = async () => {
    if (!form.mealName || !form.calories) return
    setSaving(true)
    try {
      const res = await fetch('/api/nutrition/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: today }),
      })
      if (res.ok) {
        const log = await res.json()
        setLogs(prev => [...prev, { ...log, loggedAt: new Date().toISOString() }])
        setForm({ mealName: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'lunch' })
        setShowForm(false)
        toast('Refeicao registada', 'success')
        router.refresh()
      }
    } catch { toast('Erro ao guardar', 'error') }
    finally { setSaving(false) }
  }

  const deleteLog = async (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id))
    const res = await fetch(`/api/nutrition/logs/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast('Refeicao removida', 'success')
    } else {
      setLogs(initialLogs)
    }
  }

  const byMealType = MEAL_TYPES.map(type => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    icon: MEAL_TYPE_ICONS[type],
    logs: logs.filter(l => l.mealType === type),
  })).filter(g => g.logs.length > 0)

  const inputStyle = {
    width: '100%', marginTop: 4, background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text)', fontSize: 13, padding: '8px 10px',
    boxSizing: 'border-box' as const, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.4px' }}>Nutricao</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 2 }}>
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: 'var(--text)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '8px 14px', cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Registar
          </button>
          <NextLink href="/nutrition/generate" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: '#0A0A0C',
            background: 'var(--accent)', borderRadius: 'var(--radius-md)',
            padding: '8px 14px', textDecoration: 'none',
          }}>
            <Sparkles size={14} /> Gerar Receita
          </NextLink>
        </div>
      </div>

      {/* Calorie progress bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progresso diario</span>
          <button
            onClick={() => { setGoalsForm(goals); setShowGoals(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'var(--text-muted)', background: 'transparent',
              border: 'none', cursor: 'pointer', padding: '2px 0',
            }}
          >
            <Settings2 size={12} /> Metas
          </button>
        </div>
        <CalorieBar value={totals.calories} goal={GOALS.calories} />
      </div>

      {/* Goals modal */}
      {showGoals && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowGoals(false) }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 400, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Metas Diarias</h3>
              <button onClick={() => setShowGoals(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>x</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'calories' as const, label: 'Calorias (kcal)', color: 'var(--accent)' },
                { key: 'protein' as const, label: 'Proteina (g)', color: '#22c55e' },
                { key: 'carbs' as const, label: 'Hidratos (g)', color: '#f97316' },
                { key: 'fat' as const, label: 'Gordura (g)', color: '#3b82f6' },
              ].map(m => (
                <div key={m.key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: m.color, textTransform: 'uppercase' }}>{m.label}</label>
                  <input
                    type="number"
                    value={goalsForm[m.key]}
                    onChange={e => setGoalsForm(f => ({ ...f, [m.key]: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%', marginTop: 4, background: 'var(--surface2)',
                      border: `1px solid ${m.color}40`, borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)', fontSize: 14, fontWeight: 600, padding: '10px 10px',
                      boxSizing: 'border-box', outline: 'none', textAlign: 'center',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGoals(false)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={saveGoals} disabled={savingGoals} style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0C', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 14px', cursor: 'pointer', opacity: savingGoals ? 0.7 : 1 }}>
                {savingGoals ? 'A guardar...' : 'Guardar Metas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Macro rings */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      }}>
        {[
          { value: totals.calories, goal: GOALS.calories, color: 'var(--accent)', label: 'Calorias', unit: 'kcal' as const },
          { value: totals.protein, goal: GOALS.protein, color: '#22c55e', label: 'Proteina', unit: 'g' as const },
          { value: totals.carbs, goal: GOALS.carbs, color: '#f97316', label: 'Hidratos', unit: 'g' as const },
          { value: totals.fat, goal: GOALS.fat, color: '#3b82f6', label: 'Gordura', unit: 'g' as const },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px 16px',
            display: 'flex', justifyContent: 'center',
          }}>
            <MacroRing {...m} />
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <WeekChart data={weekData} goal={GOALS.calories} />

      {/* Quick actions row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <NextLink href="/nutrition/recipes" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px 16px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
          transition: 'border-color 0.15s',
        }}>
          <BookOpen size={16} color="#a855f7" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Receituario</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{savedRecipesCount} receita{savedRecipesCount !== 1 ? 's' : ''}</div>
          </div>
        </NextLink>
        <NextLink href="/nutrition/planner" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px 16px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CalendarDays size={16} color="#3b82f6" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Planeador</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Planear semana</div>
          </div>
        </NextLink>
        <NextLink href="/nutrition/generate" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px 16px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <UtensilsCrossed size={16} color="#f97316" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Gerar com IA</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nova receita</div>
          </div>
        </NextLink>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--accent)30',
          borderRadius: 'var(--radius-md)', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: 12,
          animation: 'fadeInUp 0.2s ease',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Registar refeicao</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Nome da refeicao</label>
              <input
                value={form.mealName}
                onChange={e => setForm(f => ({ ...f, mealName: e.target.value }))}
                placeholder="ex: Peito de frango com arroz"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tipo</label>
              <select
                value={form.mealType}
                onChange={e => setForm(f => ({ ...f, mealType: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {MEAL_TYPES.map(t => <option key={t} value={t}>{MEAL_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Calorias (kcal)</label>
              <input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} placeholder="500" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Proteina (g)</label>
              <input type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} placeholder="40" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Hidratos (g)</label>
              <input type="number" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} placeholder="50" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Gordura (g)</label>
              <input type="number" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} placeholder="15" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 14px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={addLog} disabled={saving || !form.mealName || !form.calories} style={{
              fontSize: 12, fontWeight: 600, color: '#0A0A0C', background: 'var(--accent)',
              border: 'none', borderRadius: 'var(--radius-sm)', padding: '7px 14px', cursor: 'pointer',
              opacity: saving || !form.mealName || !form.calories ? 0.5 : 1,
            }}>
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Meal log */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
            Refeicoes de Hoje
            {logs.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                {logs.length} {logs.length === 1 ? 'entrada' : 'entradas'}
              </span>
            )}
          </h2>
        </div>

        {logs.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '48px 32px',
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 36 }}>🥗</div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Sem refeicoes registadas hoje</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Regista uma refeicao ou gera uma receita com IA</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowForm(true)} style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '8px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Plus size={13} /> Registar
              </button>
              <NextLink href="/nutrition/generate" style={{
                fontSize: 12, fontWeight: 600, color: '#0A0A0C',
                background: 'var(--accent)', borderRadius: 'var(--radius-md)',
                padding: '8px 14px', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Sparkles size={13} /> Gerar receita
              </NextLink>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {byMealType.map(group => (
              <div key={group.type}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{group.icon}</span> {group.label}
                  <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontWeight: 400 }}>
                    ({group.logs.reduce((s, l) => s + l.calories, 0)} kcal)
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.logs.map(log => (
                    <div key={log.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'border-color 0.15s',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{log.mealName}</div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{log.calories} kcal</span>
                          <span style={{ fontSize: 11, color: '#22c55e' }}>P {log.protein}g</span>
                          <span style={{ fontSize: 11, color: '#f97316' }}>H {log.carbs}g</span>
                          <span style={{ fontSize: 11, color: '#3b82f6' }}>G {log.fat}g</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteLog(log.id)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-disabled)', padding: 6, borderRadius: 6,
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
