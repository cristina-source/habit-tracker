'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Check, Trash2, Copy, Share2, ChefHat, ShoppingCart, ChevronLeft, Search } from 'lucide-react'
import { toast } from '@/lib/toast'

const GROUP_LABELS: Record<string, string> = {
  protein: 'Proteínas',
  vegetable: 'Legumes e Vegetais',
  vegetables: 'Legumes e Vegetais',
  fruit: 'Frutas',
  dairy: 'Lacticínios',
  grain: 'Cereais e Grãos',
  fat: 'Gorduras e Óleos',
  seasoning: 'Temperos e Especiarias',
  pantry: 'Despensa',
  other: 'Outros',
}

const GROUP_ICONS: Record<string, string> = {
  protein: '🥩', vegetable: '🥦', vegetables: '🥦', fruit: '🍎',
  dairy: '🥛', grain: '🌾', fat: '🫒', seasoning: '🧂',
  pantry: '🫙', other: '📦',
}

const GROUP_ORDER = ['protein', 'vegetable', 'vegetables', 'fruit', 'dairy', 'grain', 'fat', 'seasoning', 'pantry', 'other']

interface ShoppingItem {
  id: string
  ingredient: string
  quantity: string
  unit?: string
  category?: string
  sources?: string
  checked: boolean
}

interface RecipeMeta { name: string; servings: number; category: string }
interface ShoppingList {
  id: string
  name: string
  dateRange: string
  metadata?: { recipes?: RecipeMeta[] }
  createdAt: string
  items: ShoppingItem[]
}

interface SavedRecipe {
  id: string
  name: string
  category: string
  mealType: string
  macros: { calories?: number; protein_g?: number }
  ingredients: Array<{ item: string; quantity: string; unit: string; category?: string }>
}

const CAT_COLORS: Record<string, string> = {
  'high-protein': '#f97316', keto: '#a855f7', 'low-carb': '#22c55e',
  mediterranean: '#3b82f6', 'anti-inflammatory': '#eab308', whole30: '#14b8a6', balanced: '#ec4899',
}

export default function ShoppingPage() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [selected, setSelected] = useState<ShoppingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [addItem, setAddItem] = useState({ ingredient: '', quantity: '', unit: '' })

  // Recipe picker state
  const [showPicker, setShowPicker] = useState(false)
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [pickedRecipes, setPickedRecipes] = useState<Map<string, { recipe: SavedRecipe; servings: number }>>(new Map())
  const [listName, setListName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/nutrition/shopping')
    if (res.ok) {
      const data = await res.json()
      setLists(data)
      if (selected) {
        const updated = data.find((l: ShoppingList) => l.id === selected.id)
        if (updated) setSelected(updated)
      }
    }
    setLoading(false)
  }, [selected])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecipes = async () => {
    setLoadingRecipes(true)
    const res = await fetch('/api/nutrition/recipes')
    if (res.ok) setRecipes(await res.json())
    setLoadingRecipes(false)
  }

  const openPicker = () => {
    setShowPicker(true)
    setPickedRecipes(new Map())
    setListName('')
    setRecipeSearch('')
    loadRecipes()
  }

  const toggleRecipe = (r: SavedRecipe) => {
    setPickedRecipes(prev => {
      const next = new Map(prev)
      if (next.has(r.id)) next.delete(r.id)
      else next.set(r.id, { recipe: r, servings: 2 })
      return next
    })
  }

  const updateServings = (id: string, servings: number) => {
    setPickedRecipes(prev => {
      const next = new Map(prev)
      const entry = next.get(id)
      if (entry) next.set(id, { ...entry, servings: Math.max(1, servings) })
      return next
    })
  }

  const generateFromRecipes = async () => {
    if (pickedRecipes.size === 0) return
    setGenerating(true)

    const ingredientMap: Record<string, { quantity: number; unit: string; category: string; sources: Set<string> }> = {}

    pickedRecipes.forEach(({ recipe, servings }) => {
      if (!recipe.ingredients) return
      recipe.ingredients.forEach(ing => {
        const key = `${ing.item.toLowerCase().trim()}|${(ing.unit || '').toLowerCase().trim()}`
        const baseQty = parseFloat(ing.quantity) || 1
        const scaled = (baseQty / 2) * servings
        if (ingredientMap[key]) {
          ingredientMap[key].quantity += scaled
          ingredientMap[key].sources.add(recipe.name)
        } else {
          ingredientMap[key] = {
            quantity: scaled,
            unit: ing.unit || '',
            category: ing.category || 'other',
            sources: new Set([recipe.name]),
          }
        }
      })
    })

    const items = Object.entries(ingredientMap).map(([key, val]) => {
      const name = key.split('|')[0]
      const qty = Math.round(val.quantity * 10) / 10
      return {
        ingredient: name.charAt(0).toUpperCase() + name.slice(1),
        quantity: String(qty),
        unit: val.unit || undefined,
        category: val.category,
        sources: Array.from(val.sources).join(', '),
      }
    })

    items.sort((a, b) => {
      const aIdx = GROUP_ORDER.indexOf(a.category || 'other')
      const bIdx = GROUP_ORDER.indexOf(b.category || 'other')
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    })

    const recipeNames = Array.from(pickedRecipes.values()).map(e => e.recipe.name)
    const name = listName.trim() || recipeNames.join(' + ')
    const today = new Date().toISOString().split('T')[0]

    const metadata = {
      recipes: Array.from(pickedRecipes.values()).map(e => ({
        name: e.recipe.name,
        servings: e.servings,
        category: e.recipe.category,
      })),
    }

    const res = await fetch('/api/nutrition/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dateRange: today, items, metadata }),
    })

    if (res.ok) {
      const list = await res.json()
      setLists(prev => [list, ...prev])
      setSelected(list)
      setShowPicker(false)
      setPickedRecipes(new Map())
      toast(`Lista criada com ${items.length} ingredientes!`, 'success')
    }
    setGenerating(false)
  }

  const toggleItem = async (listId: string, itemId: string) => {
    const updateItems = (items: ShoppingItem[]) =>
      items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i)
    setSelected(prev => prev ? { ...prev, items: updateItems(prev.items) } : null)
    setLists(prev => prev.map(l => l.id === listId ? { ...l, items: updateItems(l.items) } : l))

    const res = await fetch(`/api/nutrition/shopping/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-item', itemId }),
    })
    if (!res.ok) load()
  }

  const addItemToList = async () => {
    if (!selected || !addItem.ingredient.trim()) return
    const res = await fetch(`/api/nutrition/shopping/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-item', ingredient: addItem.ingredient.trim(), quantity: addItem.quantity || '1', unit: addItem.unit || null }),
    })
    if (res.ok) {
      const item = await res.json()
      const updatedItems = [...selected.items, item]
      setSelected(prev => prev ? { ...prev, items: updatedItems } : null)
      setLists(prev => prev.map(l => l.id === selected.id ? { ...l, items: updatedItems } : l))
      setAddItem({ ingredient: '', quantity: '', unit: '' })
    }
  }

  const clearChecked = async () => {
    if (!selected) return
    const res = await fetch(`/api/nutrition/shopping/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-checked' }),
    })
    if (res.ok) {
      const updatedItems = selected.items.filter(i => !i.checked)
      setSelected(prev => prev ? { ...prev, items: updatedItems } : null)
      setLists(prev => prev.map(l => l.id === selected.id ? { ...l, items: updatedItems } : l))
      toast('Itens marcados removidos', 'success')
    }
  }

  const deleteList = async (id: string) => {
    const res = await fetch(`/api/nutrition/shopping/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setLists(prev => prev.filter(l => l.id !== id))
      if (selected?.id === id) setSelected(null)
      toast('Lista eliminada', 'success')
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
  }

  const formatListText = (list: ShoppingList) => {
    const grouped = list.items.reduce((acc, item) => {
      const cat = item.category ?? 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {} as Record<string, ShoppingItem[]>)

    let text = `🛒 ${list.name}\n`
    const meta = list.metadata as { recipes?: RecipeMeta[] } | undefined
    if (meta?.recipes?.length) {
      text += meta.recipes.map(r => `  🍽 ${r.name} (${r.servings} doses)`).join('\n') + '\n'
    }
    text += '\n'
    for (const [cat, items] of Object.entries(grouped)) {
      text += `${GROUP_ICONS[cat] ?? '📦'} ${GROUP_LABELS[cat] ?? cat}\n`
      for (const item of items) {
        text += `  ${item.checked ? '✅' : '⬜'} ${item.ingredient} — ${item.quantity}${item.unit ? ' ' + item.unit : ''}`
        if (item.sources) text += ` (${item.sources})`
        text += '\n'
      }
      text += '\n'
    }
    return text.trim()
  }

  const copyList = (list: ShoppingList) => {
    navigator.clipboard.writeText(formatListText(list))
    toast('Lista copiada', 'success')
  }

  const shareList = async (list: ShoppingList) => {
    const text = formatListText(list)
    if (navigator.share) {
      try { await navigator.share({ title: list.name, text }) } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(text)
      toast('Lista copiada', 'success')
    }
  }

  const groups = selected ? Object.entries(
    selected.items.reduce((acc, item) => {
      const cat = item.category ?? 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {} as Record<string, ShoppingItem[]>)
  ).sort((a, b) => {
    const aIdx = GROUP_ORDER.indexOf(a[0])
    const bIdx = GROUP_ORDER.indexOf(b[0])
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  }) : []

  const sk = { background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite', borderRadius: 'var(--radius-md)' } as const

  const meta = selected?.metadata as { recipes?: RecipeMeta[] } | undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.4px' }}>Lista de Compras</h1>
        <button onClick={openPicker} style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0C', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShoppingCart size={14} /> Nova lista
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected && !isMobile ? 'minmax(220px, 280px) 1fr' : '1fr', gap: 20 }}>
        {/* Lists panel */}
        <div style={{ display: isMobile && selected ? 'none' : 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ ...sk, height: 64 }} />)
          ) : lists.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36 }}>🛒</div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Sem listas criadas</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selecciona receitas para gerar automaticamente a lista de ingredientes</p>
              <button onClick={openPicker} style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0C', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 16px', cursor: 'pointer', marginTop: 4 }}>
                Criar lista a partir de receitas
              </button>
            </div>
          ) : lists.map(list => {
            const checked = list.items.filter(i => i.checked).length
            const total = list.items.length
            const pct = total > 0 ? Math.round((checked / total) * 100) : 0
            const listMeta = list.metadata as { recipes?: RecipeMeta[] } | undefined
            const recipeCount = listMeta?.recipes?.length ?? 0
            return (
              <div
                key={list.id}
                onClick={() => setSelected(list)}
                style={{
                  background: selected?.id === list.id ? 'var(--accent-dim)' : 'var(--surface)',
                  border: `1px solid ${selected?.id === list.id ? 'rgba(200,255,62,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', padding: '12px 14px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatDate(list.createdAt)} · {total} itens{recipeCount > 0 ? ` · ${recipeCount} receita${recipeCount > 1 ? 's' : ''}` : ''}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteList(list.id) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {total > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: pct === 100 ? 'var(--success)' : 'var(--accent)', width: `${pct}%`, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 10, color: pct === 100 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>{pct}%</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected list detail */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isMobile && (
                  <button onClick={() => setSelected(null)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <ChevronLeft size={16} />
                  </button>
                )}
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{selected.name}</h2>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Criada a {formatDate(selected.createdAt)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => shareList(selected)} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Share2 size={12} /> Partilhar
                </button>
                <button onClick={() => copyList(selected)} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Copy size={12} /> Copiar
                </button>
                {selected.items.some(i => i.checked) && (
                  <button onClick={clearChecked} style={{ fontSize: 11, color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer' }}>
                    Limpar marcados
                  </button>
                )}
              </div>
            </div>

            {/* Recipes summary */}
            {meta?.recipes && meta.recipes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {meta.recipes.map((r, i) => {
                  const color = CAT_COLORS[r.category] ?? 'var(--accent)'
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: `${color}10`, border: `1px solid ${color}30`,
                      borderRadius: 'var(--radius-sm)', padding: '6px 10px',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
                      <span style={{ fontSize: 10, color, fontWeight: 700 }}>{r.servings} doses</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Progress */}
            {selected.items.length > 0 && (() => {
              const checked = selected.items.filter(i => i.checked).length
              const total = selected.items.length
              const pct = Math.round((checked / total) * 100)
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: pct === 100 ? 'var(--success)' : 'var(--accent)', width: `${pct}%`, borderRadius: 99, transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {checked}/{total}
                  </span>
                </div>
              )
            })()}

            {/* Grouped items */}
            {groups.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>Lista vazia. Adiciona itens abaixo.</p>
            ) : (
              groups.map(([cat, items]) => (
                <div key={cat}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{GROUP_ICONS[cat] ?? '📦'}</span>
                    {GROUP_LABELS[cat] ?? cat}
                    <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontWeight: 400 }}>({items.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(selected.id, item.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', padding: '10px 14px', cursor: 'pointer',
                          opacity: item.checked ? 0.45 : 1, transition: 'opacity 0.15s ease',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 4,
                          border: `2px solid ${item.checked ? 'var(--accent)' : 'var(--border)'}`,
                          background: item.checked ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 0.15s ease',
                        }}>
                          {item.checked && <Check size={11} color="#0A0A0C" strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, color: 'var(--text)', textDecoration: item.checked ? 'line-through' : 'none' }}>
                            {item.ingredient}
                          </span>
                          {item.sources && (
                            <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 2 }}>
                              {item.sources}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Add manual item */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Adicionar item manual</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={addItem.ingredient} onChange={e => setAddItem(p => ({ ...p, ingredient: e.target.value }))} placeholder="Ingrediente"
                  onKeyDown={e => { if (e.key === 'Enter') addItemToList() }}
                  style={{ flex: 2, minWidth: 120, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px', outline: 'none' }}
                />
                <input value={addItem.quantity} onChange={e => setAddItem(p => ({ ...p, quantity: e.target.value }))} placeholder="Qtd"
                  style={{ flex: 1, minWidth: 50, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px', outline: 'none' }}
                />
                <input value={addItem.unit} onChange={e => setAddItem(p => ({ ...p, unit: e.target.value }))} placeholder="Unid."
                  style={{ flex: 1, minWidth: 50, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px', outline: 'none' }}
                />
                <button onClick={addItemToList} style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0C', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipe picker modal */}
      {showPicker && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowPicker(false) }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Criar Lista de Compras</h3>
                <button onClick={() => setShowPicker(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>x</button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Selecciona as receitas que vais cozinhar. Os ingredientes serao adicionados automaticamente.</p>
              {recipes.length > 3 && (
                <div style={{ position: 'relative', marginTop: 12 }}>
                  <Search size={14} color="var(--text-disabled)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={recipeSearch}
                    onChange={e => setRecipeSearch(e.target.value)}
                    placeholder="Procurar receita..."
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px 8px 32px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
              {loadingRecipes ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>A carregar receitas...</div>
              ) : recipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <ChefHat size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sem receitas guardadas.</p>
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)' }}>Gera e guarda receitas primeiro.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recipes.filter(r => !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase()) || r.category.toLowerCase().includes(recipeSearch.toLowerCase())).map(r => {
                    const picked = pickedRecipes.has(r.id)
                    const entry = pickedRecipes.get(r.id)
                    const color = CAT_COLORS[r.category] ?? 'var(--accent)'
                    const ingCount = r.ingredients?.length ?? 0
                    return (
                      <div key={r.id} style={{
                        background: picked ? `${color}08` : 'var(--surface2)',
                        border: `1px solid ${picked ? `${color}40` : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)', padding: '12px 14px',
                        display: 'flex', flexDirection: 'column', gap: 8,
                        transition: 'all 0.15s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            onClick={() => toggleRecipe(r)}
                            style={{
                              width: 20, height: 20, borderRadius: 4, cursor: 'pointer',
                              border: `2px solid ${picked ? color : 'var(--border)'}`,
                              background: picked ? color : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, transition: 'all 0.15s ease',
                            }}
                          >
                            {picked && <Check size={12} color="#0A0A0C" strokeWidth={3} />}
                          </div>
                          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleRecipe(r)}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                              <span style={{ fontSize: 10, color, fontWeight: 600 }}>{r.category}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{ingCount} ingredientes</span>
                              {r.macros?.calories && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.macros.calories} kcal</span>}
                            </div>
                          </div>
                          {picked && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              <button onClick={() => updateServings(r.id, (entry?.servings ?? 2) - 1)} style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 20, textAlign: 'center' }}>{entry?.servings ?? 2}</span>
                              <button onClick={() => updateServings(r.id, (entry?.servings ?? 2) + 1)} style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>doses</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {pickedRecipes.size > 0 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>Nome:</span>
                  <input
                    value={listName}
                    onChange={e => setListName(e.target.value)}
                    placeholder={Array.from(pickedRecipes.values()).map(e => e.recipe.name).join(' + ')}
                    style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {pickedRecipes.size} receita{pickedRecipes.size > 1 ? 's' : ''} seleccionada{pickedRecipes.size > 1 ? 's' : ''}
                  </span>
                  <button onClick={generateFromRecipes} disabled={generating} style={{
                    fontSize: 13, fontWeight: 600, color: '#0A0A0C',
                    background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)',
                    padding: '10px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: generating ? 0.7 : 1,
                  }}>
                    <ShoppingCart size={14} />
                    {generating ? 'A gerar...' : 'Gerar Lista'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
