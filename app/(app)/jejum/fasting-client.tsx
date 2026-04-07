'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FastingTimer } from '@/components/fasting-timer'
import { useToast } from '@/components/toast-provider'
import { Play, Square, Check, X, Clock } from 'lucide-react'

type Protocol = '16:8' | 'OMAD' | '36h'

interface ActiveFasting {
  id: string
  startTime: string
  protocol: Protocol
}

interface HistoryItem {
  id: string
  protocol: string
  startTime: string
  endTime: string | null
  completed: boolean
  formattedDate: string
  duration: number | null
}

interface Props {
  activeFasting: ActiveFasting | null
  history: HistoryItem[]
}

const PROTOCOLS: { value: Protocol; label: string; hours: number; desc: string; icon: string }[] = [
  { value: '16:8', label: '16:8', hours: 16, desc: '16h jejum / 8h janela alimentar', icon: '⚡' },
  { value: 'OMAD', label: 'OMAD', hours: 23, desc: 'Uma refeição por dia (23h)', icon: '🎯' },
  { value: '36h', label: '36 Horas', hours: 36, desc: 'Jejum prolongado de 36h', icon: '🔥' },
]

export function FastingClient({ activeFasting: initialActive, history: initialHistory }: Props) {
  const [activeFasting, setActiveFasting] = useState(initialActive)
  const [history, setHistory] = useState(initialHistory)
  const [protocol, setProtocol] = useState<Protocol>('16:8')
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  const startFasting = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol }),
      })
      if (res.ok) {
        const data = await res.json()
        setActiveFasting({ id: data.id, startTime: data.startTime, protocol: data.protocol })
        toast(`Jejum ${protocol} iniciado. Bom trabalho!`, 'success')
        startTransition(() => router.refresh())
      } else {
        toast('Erro ao iniciar jejum. Tenta novamente.', 'error')
      }
    } catch {
      toast('Erro de ligação. Verifica a tua rede.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const stopFasting = async () => {
    if (!activeFasting) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fasting/${activeFasting.id}/stop`, { method: 'POST' })
      if (res.ok) {
        const stopped = await res.json()
        setActiveFasting(null)
        setHistory((prev) => [
          {
            id: stopped.id,
            protocol: stopped.protocol,
            startTime: stopped.startTime,
            endTime: stopped.endTime,
            completed: stopped.completed,
            formattedDate: new Date(stopped.startTime).toLocaleString('pt-PT'),
            duration: stopped.endTime
              ? Math.round(
                  (new Date(stopped.endTime).getTime() - new Date(stopped.startTime).getTime()) / 3600000
                )
              : null,
          },
          ...prev.slice(0, 6),
        ])
        toast(stopped.completed ? 'Jejum concluído com sucesso!' : 'Jejum interrompido.', stopped.completed ? 'success' : 'info')
        startTransition(() => router.refresh())
      } else {
        toast('Erro ao parar jejum. Tenta novamente.', 'error')
      }
    } catch {
      toast('Erro de ligação. Verifica a tua rede.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Active session or start panel */}
      <div
        style={{
          background: 'var(--surface)',
          border: `1px solid ${activeFasting ? 'rgba(200,255,62,0.2)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {activeFasting && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(200,255,62,0.04), transparent 60%)',
            pointerEvents: 'none',
          }} />
        )}
        {activeFasting ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Jejum Activo
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                  Protocolo {activeFasting.protocol}
                </div>
              </div>
              <button
                onClick={stopFasting}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(255,77,77,0.3)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all var(--ease-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-bg)' }}
              >
                <Square size={14} />
                Parar Jejum
              </button>
            </div>
            <FastingTimer startTime={activeFasting.startTime} protocol={activeFasting.protocol} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px', letterSpacing: '-0.3px' }}>
                Iniciar Jejum
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Selecciona o protocolo e começa o teu jejum.
              </p>
            </div>

            {/* Protocol selector — improved cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {PROTOCOLS.map((p) => {
                const isSelected = protocol === p.value
                return (
                  <button
                    key={p.value}
                    onClick={() => setProtocol(p.value)}
                    style={{
                      padding: '16px 14px',
                      background: isSelected ? 'var(--accent-dim)' : 'var(--surface2)',
                      border: `1px solid ${isSelected ? 'rgba(200,255,62,0.35)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--ease-base)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-strong)'
                        e.currentTarget.style.background = 'var(--surface3)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.background = 'var(--surface2)'
                      }
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: 2,
                        background: 'var(--accent)',
                        borderRadius: '2px 2px 0 0',
                      }} />
                    )}
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: isSelected ? 'var(--accent)' : 'var(--text)', marginBottom: '5px' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {p.desc}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--text-disabled)' }}>
                      {p.hours}h
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={startFasting}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px 28px',
                  background: 'var(--accent)',
                  color: '#0A0A0C',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'opacity var(--ease-fast), transform var(--ease-fast), box-shadow var(--ease-fast)',
                  boxShadow: 'var(--shadow-accent)',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(200,255,62,0.3)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-accent)'
                  e.currentTarget.style.transform = ''
                }}
              >
                {loading ? (
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0A0A0C', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <Play size={16} fill="#0A0A0C" />
                )}
                Iniciar Jejum {protocol}
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(() => {
                  const hrs = protocol === '16:8' ? 16 : protocol === 'OMAD' ? 23 : 36
                  const end = new Date(Date.now() + hrs * 3600000)
                  const isNextDay = end.getDate() !== new Date().getDate()
                  return `Termina às ${end.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}h${isNextDay ? ' amanhã' : ' de hoje'}`
                })()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Motivational card — shown when no history yet */}
      {history.length === 0 && !activeFasting && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Porquê o jejum funciona
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '⚡', title: 'Energia estável', desc: 'Sem picos de insulina, foco prolongado durante a manhã.' },
              { icon: '🔥', title: 'Queima de gordura', desc: 'A partir das 12h o corpo usa gordura como combustível.' },
              { icon: '🧠', title: 'Clareza mental', desc: 'Cetose ligeira melhora a concentração e criatividade.' },
              { icon: '🔄', title: 'Autofagia', desc: 'Após 16-18h, as células iniciam o processo de limpeza.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                <div style={{ fontSize: 18 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', textAlign: 'center', marginTop: 4 }}>
            O protocolo 16:8 é o ponto de entrada ideal — 16h de jejum, 8h de janela alimentar.
          </p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '14px' }}>
            <Clock size={14} color="var(--text-muted)" />
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
              Últimas 7 Sessões
            </h2>
          </div>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Protocolo', 'Duração', 'Estado'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background var(--ease-fast)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text)' }}>
                      {item.formattedDate}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '700', background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 6px' }}>
                        {item.protocol}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                      {item.duration != null ? `${item.duration}h` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '99px',
                          background: item.completed ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: item.completed ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${item.completed ? 'rgba(16,185,129,0.2)' : 'rgba(255,77,77,0.2)'}`,
                        }}
                      >
                        {item.completed ? <Check size={10} /> : <X size={10} />}
                        {item.completed ? 'Completo' : 'Incompleto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
