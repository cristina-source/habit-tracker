const sk = {
  background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s linear infinite',
  borderRadius: 'var(--radius-md)',
} as const

export default function ProgressoLoading() {
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...sk, width: 120, height: 28 }} />
        <div style={{ ...sk, width: 200, height: 14 }} />
      </div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[1, 2, 3].map((i) => <div key={i} style={{ ...sk, height: 80 }} />)}
      </div>
      {/* Heatmap */}
      <div style={{ ...sk, height: 180 }} />
      {/* Score chart */}
      <div style={{ ...sk, height: 200 }} />
      {/* Weight */}
      <div style={{ ...sk, height: 180 }} />
    </div>
  )
}
