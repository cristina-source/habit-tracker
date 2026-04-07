'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const SLOT_LABELS: Record<string, string> = {
  breakfast: '🌅 Pequeno-almoço',
  lunch: '☀️ Almoço',
  dinner: '🌙 Jantar',
  snack: '🍎 Snack',
}

function getWeekDays(offset: number): { date: string; label: string; short: string }[] {
  const now = new Date()
  const monday = new Date(now)
  const day = monday.getDay() || 7
  monday.setDate(monday.getDate() - day + 1 + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    return {
      date: iso,
      label: d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' }),
      short: d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' }),
    }
  })
}

interface Recipe { id: string; name: string; category: string; imageUrl?: string; macros: Record<string, number>; ingredients?: Array<{ item: string; quantity: string; unit: string; category?: string }> }
interface Plan { id: string; date: string; mealSlot: string; servings: number; recipe: Recipe }

const CAT_COLORS: Record<string, string> = {
  'high-protein': '#f97316', keto: '#a855f7', 'low-carb': '#22c55e',
  mediterranean: '#3b82f6', 'anti-inflammatory': '#eab308', whole30: '#14b8a6', balanced: '#ec4899',
}

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [plans, setPlans] = useState<Plan[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState<{ date: string; slot: string } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDay, setMobileDay] = useState(0) // index into days[]
  const router = useRouter()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const days = getWeekDays(weekOffset)
  const weekStart = days[0].date
  const weekEnd = days[6].date

  const loadPlans = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/nutrition/planner?weekStart=${weekStart}&weekEnd=${weekEnd}`)
    if (res.ok) setPlans(await res.json())
    setLoading(false)
  }, [weekStart, weekEnd])

  const loadRecipes = useCallback(async () => {
    const res = await fetch('/api/nutrition/recipes')
    if (res.ok) setRecipes(await res.json())
  }, [])

  useEffect(() => { loadPlans() }, [loadPlans])
  useEffect(() => { loadRecipes() }, [loadRecipes])

  const addPlan = async (recipeId: string) => {
    if (!pickerOpen) return
    const res = await fetch('/api/nutrition/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId, date: pickerOpen.date, mealSlot: pickerOpen.slot, servings: 1 }),
    })
    if (res.ok) {
      const plan = await res.json()
      setPlans(prev => [...prev, plan])
      setPickerOpen(null)
      toast('Refeição adicionada ao plano', 'success')
    }
  }

  const removePlan = async (id: string) => {
    const res = await fetch('/api/nutrition/planner', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setPlans(prev => prev.filter(p => p.id !== id))
  }

  const generateShoppingList = async () => {
    const ingredientMap: Record<string, { quantity: number; unit: string; category: string; sources: Set<string> }> = {}
    const recipeMap: Record<string, { name: string; servings: number; category: string }> = {}

    plans.forEach(p => {
      if (!p.recipe?.ingredients) return
      const rName = p.recipe.name || 'Receita'
      if (!recipeMap[rName]) recipeMap[rName] = { name: rName, servings: p.servings, category: p.recipe.category || 'balanced' }
      else recipeMap[rName].servings += p.servings

      const ings = p.recipe.ingredients as Array<{ item: string; quantity: string; unit: string; category?: string }>
      ings.forEach(ing => {
        const key = `${ing.item.toLowerCase()}|${ing.unit || ''}`
        const qty = parseFloat(ing.quantity) || 1
        const scaled = qty * p.servings
        if (ingredientMap[key]) {
          ingredientMap[key].quantity += scaled
          ingredientMap[key].sources.add(rName)
        } else {
          ingredientMap[key] = { quantity: scaled, unit: ing.unit || '', category: ing.category || 'other', sources: new Set([rName]) }
        }
      })
    })

    const allIngredients = Object.entries(ingredientMap).map(([key, val]) => ({
      ingredient: key.split('|')[0],
      quantity: String(Math.round(val.quantity * 10) / 10),
      unit: val.unit || undefined,
      category: val.category,
      sources: Array.from(val.sources).join(', '),
    }))

    if (allIngredients.length === 0) { toast('Sem refeições planeadas esta semana', 'error'); return }

    const recipeNames = Object.values(recipeMap).map(r => r.name)
    const name = recipeNames.length <= 3 ? recipeNames.join(' + ') : `${recipeNames.length} receitas`
    const metadata = { recipes: Object.values(recipeMap) }

    const res = await fetch('/api/nutrition/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dateRange: `${weekStart}:${weekEnd}`, items: allIngredients, metadata }),
    })
    if (res.ok) { toast('Lista de compras criada com todos os ingredientes!', 'success'); router.push('/nutrition/shopping') }
  }

  const getPlan = (date: string, slot: string) => plans.find(p => p.date === date && p.mealSlot === slot)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.4px' }}>Planeador</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setWeekOffset(v => v - 1)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 8px' }}>
              {weekOffset === 0 ? 'Esta semana' : weekOffset === 1 ? 'Próxima semana' : weekOffset === -1 ? 'Semana passada' : `Semana de ${weekStart}`}
            </span>
            <button onClick={() => setWeekOffset(v => v + 1)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <button onClick={generateShoppingList} style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0C', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 14px', cursor: 'pointer' }}>
          🛒 Gerar Lista de Compras
        </button>
      </div>

      {/* Calendar — Desktop: grid 7 colunas / Mobile: vista por dia */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Day selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setMobileDay(v => Math.max(0, v - 1))} disabled={mobileDay === 0} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', opacity: mobileDay === 0 ? 0.3 : 1 }}>
              <ChevronLeft size={14} />
            </button>
            <div style={{ flex: 1, display: 'flex', gap: 4, justifyContent: 'center' }}>
              {days.map((d, i) => {
                const isToday = d.date === new Date().toISOString().split('T')[0]
                const hasPlan = plans.some(p => p.date === d.date)
                return (
                  <button key={d.date} onClick={() => setMobileDay(i)} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: mobileDay === i ? 'var(--accent)' : isToday ? 'rgba(200,255,62,0.15)' : 'var(--surface)',
                    color: mobileDay === i ? '#0A0A0C' : isToday ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 11, fontWeight: mobileDay === i || isToday ? 700 : 400,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0,
                    position: 'relative',
                  }}>
                    {d.short.split(' ')[0]?.charAt(0).toUpperCase()}
                    <span style={{ fontSize: 9 }}>{d.short.split(' ')[1]}</span>
                    {hasPlan && <span style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: '50%', background: mobileDay === i ? '#0A0A0C' : 'var(--accent)' }} />}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setMobileDay(v => Math.min(6, v + 1))} disabled={mobileDay === 6} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', opacity: mobileDay === 6 ? 0.3 : 1 }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day label */}
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
            {days[mobileDay]?.label}
          </div>

          {/* Slots for selected day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SLOTS.map(slot => {
              const d = days[mobileDay]
              if (!d) return null
              const plan = getPlan(d.date, slot)
              const color = plan ? (CAT_COLORS[plan.recipe?.category] ?? 'var(--accent)') : 'transparent'
              return (
                <div
                  key={slot}
                  onClick={() => !plan && setPickerOpen({ date: d.date, slot })}
                  style={{
                    background: plan ? `${color}10` : 'var(--surface)',
                    border: `1px solid ${plan ? `${color}30` : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    cursor: plan ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, minWidth: 100 }}>{SLOT_LABELS[slot]}</span>
                  {plan ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{plan.recipe?.name}</div>
                        {plan.recipe?.macros && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {(plan.recipe.macros as {calories?: number}).calories ?? 0} kcal · P: {(plan.recipe.macros as {protein_g?: number}).protein_g ?? 0}g
                          </div>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removePlan(plan.id) }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={16} color="var(--text-disabled)" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Daily total */}
          {(() => {
            const d = days[mobileDay]
            if (!d) return null
            const dayPlans = plans.filter(p => p.date === d.date)
            const total = dayPlans.reduce((sum, p) => sum + ((p.recipe?.macros as {calories?: number})?.calories ?? 0) * p.servings, 0)
            if (total === 0) return null
            return (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                Total: {total} kcal
              </div>
            )
          })()}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', gap: 4 }}>
            <div />
            {days.map(d => {
              const isToday = d.date === new Date().toISOString().split('T')[0]
              const dayPlans = plans.filter(p => p.date === d.date)
              const dayCalories = dayPlans.reduce((sum, p) => {
                const cal = (p.recipe?.macros as { calories?: number })?.calories ?? 0
                return sum + cal * p.servings
              }, 0)
              return (
                <div key={d.date} style={{ padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: isToday ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400, textTransform: 'capitalize' }}>{d.short}</div>
                  {dayCalories > 0 && (
                    <div style={{ fontSize: 9, color: 'var(--text-disabled)', marginTop: 2 }}>{dayCalories} kcal</div>
                  )}
                </div>
              )
            })}
          </div>
          {SLOTS.map(slot => (
            <div key={slot} style={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 4px' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{SLOT_LABELS[slot]}</span>
              </div>
              {days.map(d => {
                const plan = getPlan(d.date, slot)
                const isToday = d.date === new Date().toISOString().split('T')[0]
                const color = plan ? (CAT_COLORS[plan.recipe?.category] ?? 'var(--accent)') : 'transparent'
                return (
                  <div
                    key={d.date}
                    style={{
                      background: plan ? `${color}10` : 'var(--surface)',
                      border: `1px solid ${plan ? `${color}30` : isToday ? 'rgba(200,255,62,0.2)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      minHeight: 60,
                      padding: '6px',
                      position: 'relative',
                      cursor: plan ? 'default' : 'pointer',
                      transition: 'border-color 0.15s ease',
                    }}
                    onClick={() => !plan && setPickerOpen({ date: d.date, slot })}
                  >
                    {plan ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, paddingRight: 16 }}>{plan.recipe?.name}</div>
                        {plan.recipe?.macros && (
                          <div style={{ fontSize: 9, color: '#22c55e' }}>P: {(plan.recipe.macros as {protein_g?: number}).protein_g ?? 0}g</div>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); removePlan(plan.id) }}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 48 }}>
                        <Plus size={12} color="var(--text-disabled)" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Recipe picker modal */}
      {pickerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setPickerOpen(null) }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 480, maxHeight: '70vh', overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Escolher receita</h3>
              <button onClick={() => setPickerOpen(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
            </div>
            {recipes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sem receitas guardadas.</p>
                <button onClick={() => setPickerOpen(null)} style={{ fontSize: 12, color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}>
                  Gera uma receita primeiro →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recipes.map(r => {
                  const color = CAT_COLORS[r.category] ?? 'var(--accent)'
                  return (
                    <button key={r.id} onClick={() => addPlan(r.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface2)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                      padding: '10px 14px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color, marginTop: 2 }}>{r.category}</div>
                      </div>
                      {r.macros && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(r.macros as {calories?: number}).calories ?? 0} kcal</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
