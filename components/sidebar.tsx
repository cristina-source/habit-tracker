'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Dumbbell,
  TrendingUp,
  Apple,
  Settings,
  FileText,
} from 'lucide-react'

const navGroups = [
  {
    label: null,
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', shortcut: 'G D' },
      { href: '/habitos', icon: CheckSquare, label: 'Hábitos', shortcut: 'G H' },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { href: '/jejum', icon: Clock, label: 'Jejum', shortcut: 'G J' },
      { href: '/treino', icon: Dumbbell, label: 'Treino', shortcut: 'G T' },
      { href: '/progresso', icon: TrendingUp, label: 'Progresso', shortcut: 'G P' },
      { href: '/nutrition', icon: Apple, label: 'Nutrição', shortcut: 'G N' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/relatorio', icon: FileText, label: 'Relatório', shortcut: 'G R' },
      { href: '/definicoes', icon: Settings, label: 'Definições', shortcut: 'G ,' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside
      style={{
        width: '200px',
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '12px',
        paddingRight: '12px',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        gap: '4px',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingLeft: '8px',
          marginBottom: '20px',
        }}
      >
        <span style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: '700', lineHeight: 1 }}>◆</span>
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.3px' }}>
          Disciplina
        </span>
      </div>

      {/* Nav Groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: gi > 0 ? '8px' : 0 }}>
            {group.label && (
              <div style={{
                fontSize: '9px',
                fontWeight: '600',
                color: 'var(--text-disabled)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                paddingLeft: '12px',
                paddingBottom: '4px',
                paddingTop: '4px',
              }}>
                {group.label}
              </div>
            )}
            {group.items.map(({ href, icon: Icon, label, shortcut }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  title={shortcut}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    textDecoration: 'none',
                    transition: 'all var(--ease-fast)',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = 'var(--text)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }
                  }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                  <span>{label}</span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '10px',
                    color: 'var(--text-disabled)',
                    fontFamily: 'ui-monospace, monospace',
                    opacity: isActive ? 0.7 : 0,
                    transition: 'opacity var(--ease-fast)',
                  }} className="sidebar-shortcut">
                    {shortcut.split(' ').pop()}
                  </span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User Avatar + name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingLeft: '8px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
          marginTop: '4px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? 'User'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session?.user?.name?.split(' ')[0] ?? 'Preview'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session?.user?.email ?? '—'}
          </div>
        </div>
      </div>

      <style>{`
        a:hover .sidebar-shortcut {
          opacity: 0.5 !important;
        }
      `}</style>
    </aside>
  )
}
