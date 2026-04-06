// [ITERATE v3] — Skeleton loader para o relatório (era página sem loading state)
const sk = {
  background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s linear infinite',
  borderRadius: 'var(--radius-md)',
} as const

export default function RelatorioLoading() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...sk, width: 160, height: 28 }} />
          <div style={{ ...sk, width: 120, height: 14 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ ...sk, width: 110, height: 36 }} />
          <div style={{ ...sk, width: 120, height: 36 }} />
        </div>
      </div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[1, 2, 3, 4].map((i) => <div key={i} style={{ ...sk, height: 88 }} />)}
      </div>
      {/* Heatmap */}
      <div style={{ ...sk, height: 160 }} />
      {/* Chart */}
      <div style={{ ...sk, height: 200 }} />
      {/* Habits bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3, 4].map((i) => <div key={i} style={{ ...sk, height: 44 }} />)}
      </div>
    </div>
  )
}
