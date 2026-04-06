const sk = {
  background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s linear infinite',
  borderRadius: 'var(--radius-md)',
} as const

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...sk, width: 240, height: 28 }} />
          <div style={{ ...sk, width: 140, height: 14 }} />
        </div>
        <div style={{ ...sk, width: 120, height: 28 }} />
      </div>

      {/* Message banner */}
      <div style={{ ...sk, height: 48 }} />

      {/* KPI bento grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: '14px' }}>
        <div style={{ ...sk, gridColumn: '1', gridRow: '1 / 3', height: 180 }} />
        <div style={{ ...sk, height: 82 }} />
        <div style={{ ...sk, height: 82 }} />
        <div style={{ ...sk, height: 82 }} />
        <div style={{ ...sk, gridColumn: '2 / 4', height: 82 }} />
        <div style={{ ...sk, height: 82 }} />
      </div>

      {/* Apple Health */}
      <div style={{ ...sk, height: 60 }} />

      {/* Today habits */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...sk, width: 160, height: 18 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ ...sk, height: 56 }} />
        ))}
      </div>
    </div>
  )
}
