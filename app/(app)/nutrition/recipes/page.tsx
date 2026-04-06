'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Trash2, Search, UtensilsCrossed } from 'lucide-react'
import { toast } from '@/lib/toast'
import Link from 'next/link'

const CATEGORIES = [
  { id: '', label: 'Todas' },
  { id: 'high-protein', label: '🥩 High Protein', color: '#f97316' },
  { id: 'keto', label: '🥑 Keto', color: '#a855f7' },
  { id: 'low-carb', label: '🥦 Low Carb', color: '#22c55e' },
  { id: 'mediterranean', label: '🫒 Mediterrânica', color: '#3b82f6' },
  { id: 'anti-inflammatory', label: '🔥 Anti-Inflamatória', color: '#eab308' },
  { id: 'whole30', label: '🌿 Whole30', color: '#14b8a6' },
  { id: 'balanced', label: '⚖️ Equilibrada', color: '#ec4899' },
]

const CAT_COLORS: Record<string, string> = {
  'high-protein': '#f97316', keto: '#a855f7', 'low-carb': '#22c55e',
  mediterranean: '#3b82f6', 'anti-inflammatory': '#eab308', whole30: '#14b8a6', balanced: '#ec4899',
}

interface SavedRecipe {
  id: string
  name: string
  description?: string
  category: string
  mealType: string
  macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number }
  imageUrl?: string
  isFavourite: boolean
  createdAt: string
}

interface DetailRecipe extends SavedRecipe {
  ingredients: Array<{ item: string; quantity: string; unit: string }>
  instructions: Array<{ step: number; text: string }>
  tips?: string[]
  tags: string[]
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [selected, setSelected] = useState<DetailRecipe | null>(null)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())
  const [loggingRecipe, setLoggingRecipe] = useState(false)

  const logRecipeAsMeal = async (r: DetailRecipe) => {
    setLoggingRecipe(true)
    const macros = r.macros as { calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number }
    const today = new Date().toISOString().split('T')[0]
    try {
      const res = await fetch('/api/nutrition/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealName: r.name,
          calories: macros.calories ?? 0,
          protein: macros.protein_g ?? 0,
          carbs: macros.carbs_g ?? 0,
          fat: macros.fat_g ?? 0,
          mealType: r.mealType || 'lunch',
          date: today,
        }),
      })
      if (res.ok) {
        toast('Refeicao registada a partir da receita!', 'success')
        setSelected(null)
      }
    } catch { toast('Erro ao registar', 'error') }
    finally { setLoggingRecipe(false) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (favouritesOnly) params.set('favourites', 'true')
    const res = await fetch(`/api/nutrition/recipes?${params}`)
    if (res.ok) setRecipes(await res.json())
    setLoading(false)
  }, [category, favouritesOnly])

  useEffect(() => { load() }, [load])

  const toggleFavourite = async (r: SavedRecipe) => {
    const res = await fetch(`/api/nutrition/recipes/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavourite: !r.isFavourite }),
    })
    if (res.ok) {
      setRecipes(prev => prev.map(x => x.id === r.id ? { ...x, isFavourite: !r.isFavourite } : x))
      if (selected?.id === r.id) setSelected(prev => prev ? { ...prev, isFavourite: !r.isFavourite } : null)
    }
  }

  const deleteRecipe = async (id: string) => {
    const res = await fetch(`/api/nutrition/recipes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRecipes(prev => prev.filter(r => r.id !== id))
      setSelected(null)
      toast('Receita eliminada', 'success')
    }
  }

  const filtered = recipes.filter(r =>
    (!search || r.name.toLowerCase().includes(search.toLowerCase()))
  )

  const sk = { background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite', borderRadius: 'var(--radius-md)' } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.4px' }}>Receituário</h1>
        <Link href="/nutrition/generate" style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0C', background: 'var(--accent)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textDecoration: 'none' }}>
          + Nova receita
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar receitas…"
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 13, padding: '9px 10px 9px 32px', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {CATEGORIES.map(c => {
            const active = category === c.id
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                fontSize: 11, fontWeight: active ? 700 : 400,
                color: active ? '#0A0A0C' : (c.color ?? 'var(--text-muted)'),
                background: active ? (c.color ?? 'var(--accent)') : 'var(--surface)',
                border: `1px solid ${active ? (c.color ?? 'var(--accent)') : 'var(--border)'}`,
                borderRadius: 99, padding: '5px 12px', cursor: 'pointer',
              }}>{c.label}</button>
            )
          })}
          <button onClick={() => setFavouritesOnly(v => !v)} style={{
            fontSize: 11, fontWeight: favouritesOnly ? 700 : 400,
            color: favouritesOnly ? '#f59e0b' : 'var(--text-muted)',
            background: favouritesOnly ? 'rgba(245,158,11,0.15)' : 'var(--surface)',
            border: `1px solid ${favouritesOnly ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
            borderRadius: 99, padding: '5px 12px', cursor: 'pointer',
          }}>⭐ Favoritos</button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ ...sk, height: 160 }} />
              <div style={{ ...sk, height: 16, width: '70%' }} />
              <div style={{ ...sk, height: 12, width: '40%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 36 }}>📖</div>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Sem receitas guardadas</p>
          <Link href="/nutrition/generate" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>✨ Gerar primeira receita →</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {filtered.map(r => {
            const color = CAT_COLORS[r.category] ?? 'var(--accent)'
            const catLabel = CATEGORIES.find(c => c.id === r.category)?.label ?? r.category
            const hasImg = r.imageUrl && !imgErrors.has(r.id)
            return (
              <div
                key={r.id}
                onClick={() => setSelected(r as DetailRecipe)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {hasImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl!} alt={r.name} onError={() => setImgErrors(p => new Set([...p, r.id]))}
                    style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 140, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🍽️</div>
                )}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, flex: 1, marginRight: 8, lineHeight: 1.4 }}>{r.name}</h3>
                    <button onClick={e => { e.stopPropagation(); toggleFavourite(r) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: r.isFavourite ? '#f59e0b' : 'var(--text-muted)', padding: 0, flexShrink: 0 }}>
                      <Star size={14} fill={r.isFavourite ? '#f59e0b' : 'none'} />
                    </button>
                  </div>
                  <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 99, padding: '2px 8px' }}>{catLabel}</span>
                  {r.macros && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: '#22c55e' }}>P: {(r.macros as {protein_g?: number}).protein_g ?? 0}g</span>
                      <span style={{ fontSize: 10, color: '#f97316' }}>H: {(r.macros as {carbs_g?: number}).carbs_g ?? 0}g</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{(r.macros as {calories?: number}).calories ?? 0} kcal</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 600, maxHeight: '85vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {selected.imageUrl && !imgErrors.has(selected.id) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected.name} onError={() => setImgErrors(p => new Set([...p, selected.id]))}
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', display: 'block' }}
              />
            ) : null}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0, flex: 1 }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleFavourite(selected)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: selected.isFavourite ? '#f59e0b' : 'var(--text-muted)', padding: 4 }}>
                    <Star size={18} fill={selected.isFavourite ? '#f59e0b' : 'none'} />
                  </button>
                  <button onClick={() => deleteRecipe(selected.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
              </div>
              {selected.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{selected.description}</p>}
              {selected.macros && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{(selected.macros as {calories?: number}).calories ?? 0}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>kcal</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{(selected.macros as {protein_g?: number}).protein_g ?? 0}g</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Proteína</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>{(selected.macros as {carbs_g?: number}).carbs_g ?? 0}g</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Hidratos</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{(selected.macros as {fat_g?: number}).fat_g ?? 0}g</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Gordura</div>
                  </div>
                </div>
              )}
              {selected.ingredients && (selected.ingredients as unknown[]).length > 0 && (
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Ingredientes</h4>
                  {(selected.ingredients as Array<{item: string; quantity: string; unit: string}>).map((ing, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < (selected.ingredients as unknown[]).length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 12, color: 'var(--text)' }}>{ing.item}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              )}
              {selected.instructions && (selected.instructions as unknown[]).length > 0 && (
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Instrucoes</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(selected.instructions as Array<{step: number; text: string; duration_minutes?: number}>).map((inst) => {
                      const color = CAT_COLORS[selected.category] ?? 'var(--accent)'
                      return (
                        <div key={inst.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: `${color}20`, border: `1px solid ${color}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color }}>{inst.step}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{inst.text}</p>
                            {inst.duration_minutes && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>⏱ {inst.duration_minutes} min</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {selected.tips && (selected.tips as unknown[]).length > 0 && (
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Dicas</h4>
                  {(selected.tips as string[]).map((tip, i) => (
                    <p key={i} style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, marginTop: i > 0 ? 4 : 0 }}>• {tip}</p>
                  ))}
                </div>
              )}
              {selected.tags && selected.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.tags.map((tag: string) => (
                    <span key={tag} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 8px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                <button
                  onClick={() => logRecipeAsMeal(selected)}
                  disabled={loggingRecipe}
                  style={{
                    flex: 1, fontSize: 12, fontWeight: 600, color: '#0A0A0C',
                    background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)',
                    padding: '9px 0', cursor: 'pointer', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: loggingRecipe ? 0.7 : 1,
                  }}
                >
                  <UtensilsCrossed size={13} />
                  {loggingRecipe ? 'A registar...' : 'Registar como Refeicao'}
                </button>
                <Link href="/nutrition/planner" style={{
                  flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text)',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '9px 0', cursor: 'pointer',
                  textAlign: 'center', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  📅 Planeador
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
