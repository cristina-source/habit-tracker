'use client'

import Link from 'next/link'

export function PrintButton({ isCurrent }: { isCurrent: boolean }) {
  return (
    <div className="no-print" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Link
        href={isCurrent ? '/relatorio' : '/relatorio?month=current'}
        style={{
          padding: '9px 14px',
          background: 'var(--surface2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 9,
          fontWeight: 500,
          fontSize: 13,
          cursor: 'pointer',
          textDecoration: 'none',
        }}
      >
        {isCurrent ? 'Mês anterior' : 'Mês actual'}
      </Link>
      <button
        onClick={() => window.print()}
        style={{
          padding: '9px 18px',
          background: 'var(--accent)',
          color: '#0A0A0C',
          border: 'none',
          borderRadius: 9,
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Exportar PDF
      </button>
    </div>
  )
}
