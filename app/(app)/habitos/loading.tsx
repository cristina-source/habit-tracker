const sk = {
  background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s linear infinite',
  borderRadius: 'var(--radius-md)',
} as const

export default function HabitosLoading() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...sk, width: 120, height: 28 }} />
        <div style={{ ...sk, width: 160, height: 14 }} />
      </div>
      <div style={{ ...sk, width: 140, height: 38, borderRadius: 10 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ ...sk, height: 56 }} />
        ))}
      </div>
    </div>
  )
}
