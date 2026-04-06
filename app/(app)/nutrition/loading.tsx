const sk = {
  background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s linear infinite',
  borderRadius: 'var(--radius-md)',
} as const

export default function NutritionLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...sk, width: 100, height: 24 }} />
          <div style={{ ...sk, width: 160, height: 14 }} />
        </div>
        <div style={{ ...sk, width: 130, height: 36 }} />
      </div>
      <div style={{ ...sk, height: 140 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ ...sk, height: 56 }} />)}
      </div>
    </div>
  )
}
