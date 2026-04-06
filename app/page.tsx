'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Background accent glow */}
      <div
        style={{
          position: 'fixed',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(200,255,62,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: 'var(--accent)',
              letterSpacing: '-0.5px',
              marginBottom: '8px',
            }}
          >
            ◆ Disciplina
          </div>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-muted)',
              fontWeight: '400',
            }}
          >
            O teu sistema de execução pessoal.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '600',
                color: 'var(--text)',
                marginBottom: '6px',
              }}
            >
              Entrar na plataforma
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Usa a tua conta Google para começar a rastrear os teus hábitos.
            </p>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 20px',
              background: 'var(--accent)',
              color: '#0A0A0C',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#d4ff5a'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {/* Google Icon SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2045C17.64 8.5664 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.2045Z"
                fill="#4285F4"
              />
              <path
                d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
                fill="#34A853"
              />
              <path
                d="M3.96409 10.71C3.78409 10.17 3.68182 9.5932 3.68182 9C3.68182 8.4068 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1732 0 7.5477 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9255L15.0218 2.3441C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z"
                fill="#EA4335"
              />
            </svg>
            Entrar com Google
          </button>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Ao entrar, permites acesso ao Google Calendar para sincronizar as tuas sessões de jejum e treino.
          </p>

          {/* Direct access */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'center' }}>
            <a
              href="/dashboard"
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Entrar sem conta (preview) →
            </a>
          </div>
        </div>

        {/* Features list */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {[
            { icon: '⚡', label: 'Hábitos diários' },
            { icon: '⏱', label: 'Jejum intermitente' },
            { icon: '🏋️', label: 'Treino semanal' },
            { icon: '📊', label: 'Progresso visual' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
