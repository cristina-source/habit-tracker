import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PrintButton } from './print-button'

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id

  const { month } = await searchParams
  const now = new Date()
  const isCurrent = month === 'current'
  const referenceMonth = isCurrent ? now : subMonths(now, 1)
  const monthStart = startOfMonth(referenceMonth)
  const monthEnd = isCurrent ? now : endOfMonth(referenceMonth)
  const monthLabel = format(monthStart, 'MMMM yyyy', { locale: ptBR })

  const [dailyLogs, habits, weightLogs, fastingSessions, trainingSessions] = userId
    ? await Promise.all([
        prisma.dailyLog.findMany({
          where: { userId, date: { gte: monthStart, lte: monthEnd } },
          orderBy: { date: 'asc' },
        }),
        prisma.habit.findMany({
          where: { userId, isActive: true, deletedAt: null },
          include: {
            completions: {
              where: { completedAt: { gte: monthStart, lte: monthEnd } },
            },
          },
        }),
        prisma.weightLog.findMany({
          where: { userId, loggedAt: { gte: monthStart, lte: monthEnd } },
          orderBy: { loggedAt: 'asc' },
        }),
        prisma.fastingSession.findMany({
          where: { userId, startTime: { gte: monthStart, lte: monthEnd }, completed: true },
        }),
        prisma.trainingSession.findMany({
          where: { userId, scheduledAt: { gte: monthStart, lte: monthEnd }, completed: true },
        }),
      ])
    : [[], [], [], [], []]

  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const totalDays = allDays.length
  const activeDays = dailyLogs.filter((d) => d.consistencyScore > 0).length
  const avgScore = dailyLogs.length > 0
    ? Math.round(dailyLogs.reduce((s, d) => s + d.consistencyScore, 0) / dailyLogs.length)
    : 0
  const avgWater = dailyLogs.length > 0
    ? (dailyLogs.reduce((s, d) => s + d.waterIntake, 0) / dailyLogs.length).toFixed(1)
    : '—'

  const firstWeight = weightLogs[0]?.weight
  const lastWeight = weightLogs[weightLogs.length - 1]?.weight
  const weightDelta = firstWeight && lastWeight ? (lastWeight - firstWeight).toFixed(1) : null

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#C8FF3E'
    if (score >= 65) return '#3EFFC8'
    if (score >= 40) return '#FFB800'
    return '#FF4D4D'
  }

  const getDayScore = (day: Date) => {
    const log = dailyLogs.find((d) => isSameDay(new Date(d.date), day))
    return log?.consistencyScore ?? null
  }

  const getDayColor = (score: number | null) => {
    if (score === null) return '#1E1E22'
    if (score >= 85) return '#C8FF3E'
    if (score >= 65) return 'rgba(200,255,62,0.55)'
    if (score >= 40) return 'rgba(200,255,62,0.25)'
    if (score > 0) return 'rgba(200,255,62,0.1)'
    return 'rgba(255,77,77,0.3)'
  }

  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  const firstDayOfWeek = monthStart.getDay()
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null as unknown as Date)
  for (const day of allDays) {
    currentWeek.push(day)
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = [] }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  const userName = session?.user?.name?.split(' ')[0] ?? 'Utilizador'

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-page { padding: 32px !important; }
        }
      `}</style>

      <div className="print-page" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Relatório de Progresso
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize', marginBottom: 4 }}>
              {monthLabel}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {userName} · gerado em {format(now, "d 'de' MMMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <PrintButton isCurrent={isCurrent} />
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Dias activos', value: `${activeDays}/${totalDays}`, sub: `${Math.round((activeDays / totalDays) * 100)}% do mês` },
            { label: 'Score médio', value: `${avgScore}`, sub: avgScore >= 75 ? 'Consistente' : avgScore >= 50 ? 'Melhorável' : 'Em risco', color: getScoreColor(avgScore) },
            { label: 'Jejuns concluídos', value: `${(fastingSessions as { id: string }[]).length}`, sub: 'sessões completas' },
            { label: 'Treinos', value: `${(trainingSessions as { id: string }[]).length}`, sub: 'sessões concluídas' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '16px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: color ?? 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Calendar heatmap */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Calendário de Consistência</h2>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', overflowX: 'auto' }}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} style={{ width: 34, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', gap: 4 }}>
                {week.map((day, di) => {
                  if (!day) return <div key={di} style={{ width: 34, height: 34, flexShrink: 0 }} />
                  const score = getDayScore(day)
                  return (
                    <div key={di} title={`${format(day, 'd MMM')} — ${score !== null ? `Score: ${Math.round(score)}` : 'Sem registo'}`} style={{
                      width: 34, height: 34, borderRadius: 6, flexShrink: 0,
                      background: getDayColor(score),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600,
                      color: score !== null && score >= 65 ? '#0A0A0C' : 'var(--text-muted)',
                    }}>
                      {format(day, 'd')}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Peso + medidas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Evolução do Peso</h2>
            {weightLogs.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sem registos neste mês.</p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Início</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{firstWeight} kg</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fim</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{lastWeight} kg</div>
                  </div>
                </div>
                {weightDelta !== null && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: parseFloat(weightDelta) <= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: parseFloat(weightDelta) <= 0 ? 'var(--success)' : 'var(--danger)',
                    fontSize: 14, fontWeight: 600,
                  }}>
                    {parseFloat(weightDelta) > 0 ? '+' : ''}{weightDelta} kg no mês
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Água & Bem-estar</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Média de água</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{avgWater} L/dia</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dias activos</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{activeDays} dias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hábitos */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Hábitos — Taxa de Conclusão</h2>
          {(habits as { id: string; name: string; color: string; completions: { id: string }[] }[]).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sem hábitos activos.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(habits as { id: string; name: string; color: string; completions: { id: string }[] }[])
                .map((h) => {
                  const pct = Math.round((h.completions.length / totalDays) * 100)
                  return (
                    <div key={h.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{h.name}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>
                          {h.completions.length}/{totalDays} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: h.color, borderRadius: 99 }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Habit Tracker · Relatório gerado automaticamente</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(now, "d MMM yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
      </div>
    </>
  )
}
