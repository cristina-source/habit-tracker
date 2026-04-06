'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Dumbbell,
  TrendingUp,
  Settings,
  Search,
  CornerDownLeft,
  Play,
  Plus,
  Droplets,
} from 'lucide-react'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  shortcut?: string
  keywords?: string
  group: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const commands: Command[] = [
    // Navegação
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Visão geral do dia', icon: <LayoutDashboard size={16} />, action: () => router.push('/dashboard'), shortcut: 'G D', group: 'Navegação', keywords: 'home início' },
    { id: 'nav-habitos', label: 'Hábitos', description: 'Gerir e completar hábitos diários', icon: <CheckSquare size={16} />, action: () => router.push('/habitos'), shortcut: 'G H', group: 'Navegação', keywords: 'habits' },
    { id: 'nav-jejum', label: 'Jejum Intermitente', description: 'Iniciar ou parar sessão de jejum', icon: <Clock size={16} />, action: () => router.push('/jejum'), shortcut: 'G J', group: 'Navegação', keywords: 'fasting 16:8 omad jeûne' },
    { id: 'nav-treino', label: 'Treino', description: 'Ver e registar plano de treino', icon: <Dumbbell size={16} />, action: () => router.push('/treino'), shortcut: 'G T', group: 'Navegação', keywords: 'workout gym exercício força' },
    { id: 'nav-progresso', label: 'Progresso', description: 'Evolução, heatmap e streaks', icon: <TrendingUp size={16} />, action: () => router.push('/progresso'), shortcut: 'G P', group: 'Navegação', keywords: 'stats analytics evolução' },
    { id: 'nav-definicoes', label: 'Definições', description: 'Conta, Apple Health e integrações', icon: <Settings size={16} />, action: () => router.push('/definicoes'), shortcut: 'G ,', group: 'Navegação', keywords: 'settings config account' },
    // Acções rápidas
    { id: 'action-jejum', label: 'Iniciar Jejum', description: 'Começa uma nova sessão de jejum', icon: <Play size={16} />, action: () => router.push('/jejum'), group: 'Acções Rápidas', keywords: 'start fasting começar jejum' },
    { id: 'action-habito', label: 'Criar Novo Hábito', description: 'Adiciona um hábito ao teu plano diário', icon: <Plus size={16} />, action: () => router.push('/habitos'), group: 'Acções Rápidas', keywords: 'new habit adicionar criar' },
    { id: 'action-treino', label: 'Registar Treino Hoje', description: 'Adiciona sessão de treino para hoje', icon: <Dumbbell size={16} />, action: () => router.push('/treino'), group: 'Acções Rápidas', keywords: 'workout log registar sessão' },
    { id: 'action-agua', label: 'Registar Água', description: 'Actualiza a tua hidratação diária', icon: <Droplets size={16} />, action: () => router.push('/dashboard'), group: 'Acções Rápidas', keywords: 'water hidratação beber' },
  ]

  const filteredCommands = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.toLowerCase().includes(q) ||
          cmd.group.toLowerCase().includes(q)
        )
      })
    : commands

  // Group the filtered commands
  const grouped = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  // Flat list for keyboard navigation
  const flatList = Object.values(grouped).flat()

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const runCommand = useCallback((cmd: Command) => {
    cmd.action()
    close()
  }, [close])

  // Open/close with ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => {
          if (!prev) { setQuery(''); setSelectedIndex(0) }
          return !prev
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus input when open
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  // Keyboard navigation within palette
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = flatList[selectedIndex]
        if (cmd) runCommand(cmd)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, flatList, selectedIndex, close, runCommand])

  useEffect(() => { setSelectedIndex(0) }, [query])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9990,
          animation: 'fadeIn 150ms ease both',
        }}
      />

      {/* Palette */}
      <div
        style={{
          position: 'fixed',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 560,
          background: 'var(--surface2)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.04)',
          zIndex: 9991,
          overflow: 'hidden',
          animation: 'scaleIn 180ms cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={16} color="var(--text-muted)" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar comandos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 400,
              outline: 'none',
              padding: 0,
              minHeight: 'unset',
              boxShadow: 'none',
            }}
          />
          <kbd style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            background: 'var(--surface3)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '2px 6px',
            fontFamily: 'ui-monospace, monospace',
          }}>
            ESC
          </kbd>
        </div>

        {/* Results with groups */}
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '6px' }}>
          {flatList.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Nenhum resultado para &ldquo;{query}&rdquo;
            </div>
          ) : (
            (() => {
              let globalIdx = 0
              return Object.entries(grouped).map(([groupName, cmds]) => (
                <div key={groupName}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: 'var(--text-disabled)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '8px 12px 4px',
                  }}>
                    {groupName}
                  </div>
                  {cmds.map((cmd) => {
                    const idx = globalIdx++
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => runCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          padding: '10px 12px',
                          background: isSelected ? 'var(--accent-dim)' : 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background var(--ease-fast), color var(--ease-fast)',
                        }}
                      >
                        <span style={{
                          color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                          transition: 'color var(--ease-fast)',
                        }}>
                          {cmd.icon}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                            {cmd.label}
                          </div>
                          {cmd.description && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          {cmd.shortcut && (
                            <kbd style={{
                              fontSize: 10,
                              color: 'var(--text-muted)',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                              padding: '1px 6px',
                              fontFamily: 'ui-monospace, monospace',
                            }}>
                              {cmd.shortcut}
                            </kbd>
                          )}
                          {isSelected && (
                            <CornerDownLeft size={12} color="var(--accent)" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            })()
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          {[
            { k: '↑↓', label: 'navegar' },
            { k: '↵', label: 'seleccionar' },
            { k: '⌘K', label: 'fechar' },
          ].map(({ k, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 10 }}>{k}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
