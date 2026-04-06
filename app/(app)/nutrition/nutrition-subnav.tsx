'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Sparkles, BookOpen, CalendarDays, ShoppingCart } from 'lucide-react'

const subNav = [
  { href: '/nutrition', label: 'Visao Geral', exact: true, icon: BarChart3 },
  { href: '/nutrition/generate', label: 'Gerar Receita', icon: Sparkles },
  { href: '/nutrition/recipes', label: 'Receituario', icon: BookOpen },
  { href: '/nutrition/planner', label: 'Planeador', icon: CalendarDays },
  { href: '/nutrition/shopping', label: 'Compras', icon: ShoppingCart },
]

export function NutritionSubnav() {
  const pathname = usePathname()

  return (
    <div style={{
      display: 'flex',
      gap: '2px',
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
      padding: '0 8px',
    }}>
      {subNav.map(({ href, label, exact, icon: Icon }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href) && pathname !== '/nutrition'
        const activeExact = exact && pathname === href
        const active = isActive || activeExact
        return (
          <Link
            key={href}
            href={href}
            style={{
              fontSize: '12px',
              fontWeight: active ? '600' : '400',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              textDecoration: 'none',
              padding: '11px 14px',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon size={13} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
