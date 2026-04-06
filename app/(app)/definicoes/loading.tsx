// [ITERATE v3] — Skeleton loader para definições
const sk = {
  background: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface3) 50%, var(--surface2) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s linear infinite',
  borderRadius: 'var(--radius-md)',
} as const

export default function DefinicoesLoading() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ ...sk, width: 140, height: 28 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ ...sk, width: 120, height: 18 }} />
          <div style={{ ...sk, height: 44 }} />
          <div style={{ ...sk, height: 44 }} />
        </div>
      ))}
    </div>
  )
}
