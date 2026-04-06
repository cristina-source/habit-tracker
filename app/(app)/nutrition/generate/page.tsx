'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import Link from 'next/link'

const CATEGORIES = [
  { id: 'high-protein', label: 'High Protein', icon: '🥩', color: '#f97316', desc: 'Mín. 35g proteína por dose' },
  { id: 'keto', label: 'Keto', icon: '🥑', color: '#a855f7', desc: 'Máx. 10g net carbs' },
  { id: 'low-carb', label: 'Low Carb', icon: '🥦', color: '#22c55e', desc: 'Máx. 20g net carbs' },
  { id: 'mediterranean', label: 'Mediterrânica', icon: '🫒', color: '#3b82f6', desc: 'Azeite, peixe, legumes' },
  { id: 'anti-inflammatory', label: 'Anti-Inflamatória', icon: '🔥', color: '#eab308', desc: 'Cúrcuma, ómega-3, antioxidantes' },
  { id: 'whole30', label: 'Whole30', icon: '🌿', color: '#14b8a6', desc: 'Sem grãos, laticínios ou açúcar' },
  { id: 'balanced', label: 'Equilibrada', icon: '⚖️', color: '#ec4899', desc: 'Macros equilibrados, alimentos limpos' },
]

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Pequeno-almoço' },
  { id: 'lunch', label: 'Almoço' },
  { id: 'dinner', label: 'Jantar' },
  { id: 'snack', label: 'Snack' },
  { id: 'post-workout', label: 'Pós-treino' },
]

const COOK_TIMES = ['15 min', '30 min', '45 min', '1 hora', '1.5 horas']

type Step = 'category' | 'options' | 'loading' | 'result'

interface Recipe {
  name: string
  description: string
  category: string
  meal_type: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  difficulty: string
  macros_per_serving: {
    calories: number
    protein_g: number
    carbs_g: number
    net_carbs_g: number
    fat_g: number
    fiber_g: number
  }
  ingredients: Array<{ item: string; quantity: string; unit: string; category: string }>
  instructions: Array<{ step: number; text: string; duration_minutes?: number }>
  tips: string[]
  substitutions?: string[]
  meal_prep_note?: string
  imageUrl?: string
  tags: string[]
}

function getCategoryColor(cat: string): string {
  const c = CATEGORIES.find(c => c.id === cat)
  return c?.color ?? 'var(--accent)'
}

export default function GeneratePage() {
  const [step, setStep] = useState<Step>('category')
  const [category, setCategory] = useState('')
  const [mealType, setMealType] = useState('lunch')
  const [cookingTime, setCookingTime] = useState('30 min')
  const [servings, setServings] = useState('2')
  const [ingredients, setIngredients] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [saving, setSaving] = useState(false)
  const [loggingMeal, setLoggingMeal] = useState(false)
  const [imgError, setImgError] = useState(false)
  const router = useRouter()

  const logAsMeal = async () => {
    if (!recipe) return
    setLoggingMeal(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/nutrition/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealName: recipe.name,
          calories: recipe.macros_per_serving.calories,
          protein: recipe.macros_per_serving.protein_g,
          carbs: recipe.macros_per_serving.carbs_g,
          fat: recipe.macros_per_serving.fat_g,
          mealType: recipe.meal_type,
          date: today,
        }),
      })
      if (res.ok) toast('Refeicao registada!', 'success')
    } catch { toast('Erro ao registar', 'error') }
    finally { setLoggingMeal(false) }
  }

  const generate = async () => {
    setStep('loading')
    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, mealType, cookingTime, servings: parseInt(servings), availableIngredients: ingredients, cuisine }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast(body.error ?? 'Erro ao gerar receita.', 'error')
        setStep('options')
        return
      }
      const { recipe: r } = await res.json()
      setRecipe(r)
      setImgError(false)
      setStep('result')
    } catch {
      toast('Erro ao gerar receita. Verifica a chave API.', 'error')
      setStep('options')
    }
  }

  const saveRecipe = async () => {
    if (!recipe) return
    setSaving(true)
    try {
      const res = await fetch('/api/nutrition/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipe.name,
          description: recipe.description,
          category: recipe.category,
          mealType: recipe.meal_type,
          macros: recipe.macros_per_serving,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          tips: recipe.tips,
          tags: recipe.tags,
          imageUrl: recipe.imageUrl,
        }),
      })
      if (res.ok) {
        toast('Receita guardada no Receituário!', 'success')
        router.push('/nutrition/recipes')
      }
    } catch { toast('Erro ao guardar', 'error') }
    finally { setSaving(false) }
  }

  const catColor = getCategoryColor(category)

  if (step === 'category') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.4px' }}>Gerar Receita com IA</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>Escolhe uma categoria nutricional</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setStep('options') }}
              style={{
                background: 'var(--surface)', border: `1px solid ${cat.color}30`,
                borderRadius: 'var(--radius-md)', padding: '20px 16px',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.background = `${cat.color}08` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${cat.color}30`; e.currentTarget.style.background = 'var(--surface)' }}
            >
              <span style={{ fontSize: 28 }}>{cat.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: cat.color }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{cat.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'options') {
    const cat = CATEGORIES.find(c => c.id === category)!
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setStep('category')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>←</button>
          <div>
            <span style={{ fontSize: 20 }}>{cat.icon}</span>{' '}
            <span style={{ fontSize: 18, fontWeight: 700, color: cat.color }}>{cat.label}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo de refeição</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {MEAL_TYPES.map(mt => (
                <button key={mt.id} onClick={() => setMealType(mt.id)} style={{
                  fontSize: 12, fontWeight: mealType === mt.id ? 600 : 400,
                  color: mealType === mt.id ? '#0A0A0C' : 'var(--text-muted)',
                  background: mealType === mt.id ? cat.color : 'var(--surface)',
                  border: `1px solid ${mealType === mt.id ? cat.color : 'var(--border)'}`,
                  borderRadius: 99, padding: '6px 14px', cursor: 'pointer',
                }}>{mt.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tempo de cozinha</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {COOK_TIMES.map(t => (
                  <button key={t} onClick={() => setCookingTime(t)} style={{
                    fontSize: 11, fontWeight: cookingTime === t ? 600 : 400,
                    color: cookingTime === t ? '#0A0A0C' : 'var(--text-muted)',
                    background: cookingTime === t ? cat.color : 'var(--surface)',
                    border: `1px solid ${cookingTime === t ? cat.color : 'var(--border)'}`,
                    borderRadius: 99, padding: '5px 10px', cursor: 'pointer',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doses</label>
              <input type="number" min={1} max={10} value={servings} onChange={e => setServings(e.target.value)}
                style={{ marginTop: 8, width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 14, padding: '8px 10px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ingredientes disponíveis (opcional)</label>
            <textarea value={ingredients} onChange={e => setIngredients(e.target.value)}
              placeholder="ex: frango, batata-doce, brócolos…"
              rows={2}
              style={{ marginTop: 8, width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Culinária / Estilo (opcional)</label>
            <input value={cuisine} onChange={e => setCuisine(e.target.value)}
              placeholder="ex: mediterrânica, asiática, portuguesa…"
              style={{ marginTop: 8, width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px', boxSizing: 'border-box' }}
            />
          </div>

          <button onClick={generate} style={{
            fontSize: 14, fontWeight: 700, color: '#0A0A0C',
            background: cat.color, border: 'none', borderRadius: 'var(--radius-md)',
            padding: '12px 24px', cursor: 'pointer', marginTop: 4,
          }}>
            ✨ Gerar Receita
          </button>
        </div>
      </div>
    )
  }

  if (step === 'loading') {
    const sk = { background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite', borderRadius: 'var(--radius-md)' } as const
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
        <div style={{ ...sk, height: 240, borderRadius: 'var(--radius-lg)' }} />
        <div style={{ ...sk, width: '60%', height: 28 }} />
        <div style={{ ...sk, width: '40%', height: 16 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ ...sk, flex: 1, height: 60 }} />)}
        </div>
        <div style={{ ...sk, height: 120 }} />
        <div style={{ ...sk, height: 160 }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
          A IA está a criar a tua receita…
        </p>
      </div>
    )
  }

  if (step === 'result' && recipe) {
    const cat = CATEGORIES.find(c => c.id === recipe.category)
    const color = cat?.color ?? 'var(--accent)'
    const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
        {/* Image */}
        {recipe.imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 'var(--radius-lg)', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: 240, borderRadius: 'var(--radius-lg)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
            {cat?.icon ?? '🍽️'}
          </div>
        )}

        {/* Title + badges */}
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 99, padding: '3px 10px' }}>{cat?.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 10px' }}>{recipe.difficulty}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 10px' }}>⏱ {totalTime} min</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 10px' }}>👤 {recipe.servings} dose{recipe.servings > 1 ? 's' : ''}</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>{recipe.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6 }}>{recipe.description}</p>
        </div>

        {/* Macro strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { label: 'Calorias', value: `${recipe.macros_per_serving.calories}`, unit: 'kcal', color: 'var(--accent)' },
            { label: 'Proteína', value: `${recipe.macros_per_serving.protein_g}g`, color: '#22c55e' },
            { label: 'Hidratos', value: `${recipe.macros_per_serving.carbs_g}g`, color: '#f97316' },
            { label: 'Gordura', value: `${recipe.macros_per_serving.fat_g}g`, color: '#3b82f6' },
            { label: 'Fibra', value: `${recipe.macros_per_serving.fiber_g}g`, color: '#8b5cf6' },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
              {m.unit && <div style={{ fontSize: 9, color: 'var(--text-disabled)' }}>{m.unit}</div>}
            </div>
          ))}
        </div>

        {/* Ingredients */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ingredientes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recipe.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < recipe.ingredients.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{ing.item}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{ing.quantity} {ing.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instruções</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recipe.instructions.map((inst) => (
              <div key={inst.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{inst.step}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{inst.text}</p>
                  {inst.duration_minutes && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>⏱ {inst.duration_minutes} min</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        {recipe.tips?.length > 0 && (
          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dicas</h3>
            {recipe.tips.map((tip, i) => (
              <p key={i} style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, marginTop: i > 0 ? 4 : 0 }}>• {tip}</p>
            ))}
          </div>
        )}

        {/* Meal prep note */}
        {recipe.meal_prep_note && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>📦</span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{recipe.meal_prep_note}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button onClick={saveRecipe} disabled={saving} style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0C', background: color, border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'A guardar...' : '💾 Guardar no Receituario'}
          </button>
          <button onClick={logAsMeal} disabled={loggingMeal} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', cursor: 'pointer', opacity: loggingMeal ? 0.7 : 1 }}>
            {loggingMeal ? 'A registar...' : '🍽️ Registar Refeicao'}
          </button>
          <button onClick={() => { setStep('options'); setRecipe(null) }} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', cursor: 'pointer' }}>
            🔄 Gerar Outra
          </button>
          <button onClick={() => { setStep('category'); setRecipe(null); setCategory('') }} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', cursor: 'pointer' }}>
            Nova Categoria
          </button>
        </div>
      </div>
    )
  }

  return null
}
