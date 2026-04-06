const sk = {
  background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s linear infinite',
  borderRadius: 'var(--radius-md)',
} as const

export default function TreinoLoading() {
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...sk, width: 100, height: 28 }} />
        <div style={{ ...sk, width: 220, height: 14 }} />
      </div>
      {/* Weekly stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[1, 2, 3].map((i) => <div key={i} style={{ ...sk, height: 80 }} />)}
      </div>
      {/* Type selector */}
      <div style={{ ...sk, height: 100 }} />
      {/* Weekly grid */}
      <div style={{ ...sk, height: 180 }} />
      {/* Heatmap */}
      <div style={{ ...sk, height: 100 }} />
    </div>
  )
}
