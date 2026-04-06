'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, User, Calendar, Shield, Heart, Copy, Check, RefreshCw, Smartphone } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
      <Icon size={14} />
      <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="stagger-1"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        transition: 'border-color var(--ease-base), box-shadow var(--ease-base)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {children}
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: 'var(--accent-dim)', border: '1px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: 'var(--accent)',
      }}>
        {n}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 3 }}
        dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  )
}

type Tab = 'perfil' | 'integracoes' | 'conta'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'integracoes', label: 'Integrações', icon: Heart },
  { id: 'conta', label: 'Conta', icon: Shield },
]

export default function DefinicoesPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<Tab>('perfil')
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState<'token' | 'endpoint' | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const endpoint = typeof window !== 'undefined'
    ? `${window.location.origin}/api/health-sync`
    : '/api/health-sync'

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/health-token')
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
      }
    } catch { /* preview mode */ }
  }, [])

  useEffect(() => {
    if (session?.user?.id) fetchToken()
  }, [session, fetchToken])

  const copy = async (text: string, type: 'token' | 'endpoint') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const regenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch('/api/health-token', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
      }
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
          Definições
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Gerir conta, integrações e preferências.</p>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: 4,
      }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8,
                background: active ? 'var(--accent-dim)' : 'transparent',
                border: active ? '1px solid rgba(200,255,62,0.2)' : '1px solid transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all var(--ease-fast)',
                flex: 1, justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--surface2)'
                  e.currentTarget.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Tab: Perfil */}
      {tab === 'perfil' && (
      <Card>
        <SectionLabel icon={User} label="Perfil" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
            border: '2px solid var(--border)', background: 'var(--surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt={session?.user?.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-muted)' }}>
                {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text)', marginBottom: 2 }}>
              {session?.user?.name ?? 'Preview'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {session?.user?.email ?? '—'}
            </div>
          </div>
        </div>
      </Card>
      )}

      {/* Tab: Integrações */}
      {tab === 'integracoes' && (
      <>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionLabel icon={Heart} label="Apple Health" />
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6,
            background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
          }}>
            iOS Shortcut
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Sincroniza automaticamente os teus dados de saúde — passos, sono, frequência cardíaca, peso e calorias — via iOS Shortcuts. Os dados chegam ao dashboard em tempo real.
        </p>

        {/* What gets synced */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          padding: '14px 16px',
          background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)',
        }}>
          {[
            { icon: '👟', label: 'Passos diários' },
            { icon: '😴', label: 'Horas de sono' },
            { icon: '❤️', label: 'Freq. cardíaca' },
            { icon: '🔥', label: 'Calorias activas' },
            { icon: '⚖️', label: 'Peso corporal' },
            { icon: '💧', label: 'Hidratação' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Setup steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Step n={1} text='Abre a app <strong style="color:var(--text)">Atalhos</strong> no iPhone e cria um novo atalho.' />
          <Step n={2} text='Adiciona a ação <strong style="color:var(--text)">"Obter Quantidade de Saúde"</strong> para cada métrica (Passos, Sono, FC, Peso, Calorias).' />
          <Step n={3} text='Adiciona a ação <strong style="color:var(--text)">"Obter conteúdo do URL"</strong> com o método POST e os dados abaixo.' />
          <Step n={4} text='Define a ação para correr <strong style="color:var(--text)">automaticamente às 22h</strong> todos os dias em Automações.' />
        </div>

        {/* API Endpoint */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Endpoint da API
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 14px',
          }}>
            <code style={{ flex: 1, fontSize: 12, color: 'var(--accent2)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
              {endpoint}
            </code>
            <button
              onClick={() => copy(endpoint, 'endpoint')}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center',
                padding: 4, borderRadius: 4,
              }}
            >
              {copied === 'endpoint' ? <Check size={14} color="var(--accent)" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* API Token */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Token pessoal (Authorization: Bearer)
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 14px',
          }}>
            <code style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
              {token ?? (session?.user?.id ? '••••••••••••••••••••••••••••••••' : 'Entra com Google para gerar')}
            </code>
            {token && (
              <>
                <button
                  onClick={() => copy(token, 'token')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, padding: 4, borderRadius: 4 }}
                >
                  {copied === 'token' ? <Check size={14} color="var(--accent)" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={regenerate}
                  disabled={regenerating}
                  title="Regenerar token"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, padding: 4, borderRadius: 4 }}
                >
                  <RefreshCw size={14} style={{ animation: regenerating ? 'spin 0.8s linear infinite' : 'none' }} />
                </button>
              </>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Trata este token como uma password. Regenera se for comprometido.
          </p>
        </div>

        {/* JSON payload example */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Corpo do pedido (JSON)
          </div>
          <pre style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '14px 16px',
            fontSize: 12, color: 'var(--text-secondary)',
            fontFamily: 'ui-monospace, monospace',
            lineHeight: 1.7, overflowX: 'auto',
          }}>{`{
  "steps":        12453,
  "sleepHours":   7.5,
  "heartRateAvg": 62,
  "restingHR":    52,
  "activeEnergy": 487,
  "weight":       68.2,
  "waterIntake":  2.1
}`}</pre>
        </div>

        {/* Shortcut template link */}
        <a
          href="https://support.apple.com/pt-pt/guide/shortcuts/welcome/ios"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)',
            borderRadius: 10, color: '#FF3B30', textDecoration: 'none',
            fontSize: 13, fontWeight: 600,
            transition: 'background var(--ease-fast)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,59,48,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,59,48,0.08)')}
        >
          <Smartphone size={16} />
          Guia de configuração do iOS Atalhos
        </a>
      </Card>

      <Card>
        <SectionLabel icon={Calendar} label="Conta Ligada" />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'var(--surface2)',
          borderRadius: 8, border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2045C17.64 8.5664 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.2045Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5932 3.68182 9C3.68182 8.4068 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1732 0 7.5477 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9255L15.0218 2.3441C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
            </svg>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Google</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Google Calendar sincronizado</div>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            Activo
          </span>
        </div>
      </Card>
      </>
      )}

      {/* Tab: Conta */}
      {tab === 'conta' && (
      <>
        <Card>
          <SectionLabel icon={Shield} label="Privacidade" />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Os teus dados são privados e apenas acessíveis com a tua conta. Os dados de saúde enviados pelo Apple Health ficam armazenados de forma segura e nunca são partilhados com terceiros.
          </p>
        </Card>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '13px 20px',
            background: 'var(--danger-bg)', border: '1px solid rgba(255,77,77,0.2)',
            borderRadius: 'var(--radius-md)', color: 'var(--danger)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,77,77,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--danger-bg)')}
        >
          <LogOut size={16} />
          Terminar Sessão
        </button>
      </>
      )}
    </div>
  )
}
