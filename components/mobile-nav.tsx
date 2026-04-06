'use client'

// [ITERATE v2] — Mobile navigation overlay (hamburger menu)
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, Clock, Dumbbell,
  TrendingUp, Settings, FileText, Apple, Menu, X,
} from 'lucide-react'

const navGroups = [
  {
    label: null,
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/habitos', icon: CheckSquare, label: 'Hábitos' },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { href: '/jejum', icon: Clock, label: 'Jejum' },
      { href: '/treino', icon: Dumbbell, label: 'Treino' },
      { href: '/progresso', icon: TrendingUp, label: 'Progresso' },
      { href: '/nutrition', icon: Apple, label: 'Nutrição' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/relatorio', icon: FileText, label: 'Relatório' },
      { href: '/definicoes', icon: Settings, label: 'Definições' },
    ],
  },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Hamburger button — só visível em mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        style={{
          position: 'fixed',
          top: 14,
          left: 14,
          zIndex: 200,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text)',
        }}
        className="mobile-menu-btn"
      >
        <Menu size={18} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 300,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          zIndex: 400,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 12px',
          gap: 4,
          overflowY: 'auto',
        }}
        className="mobile-drawer"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.3px' }}>◆ Disciplina</span>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 8 }}>
            {group.label && (
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 8px 4px' }}>
                {group.label}
              </div>
            )}
            {group.items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 10px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    transition: 'background 0.12s',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <style>{`
        .mobile-menu-btn { display: none !important; }
        .mobile-drawer  { display: none !important; }

        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .mobile-drawer  { display: flex !important; }
        }
      `}</style>
    </>
  )
}
