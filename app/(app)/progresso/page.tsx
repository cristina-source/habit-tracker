import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ProgressClient } from './progress-client'
import { subWeeks, startOfWeek, endOfWeek, startOfDay } from 'date-fns'

export default async function ProgressoPage() {
  const session = await auth()
  const userId = session?.user?.id

  const now = new Date()
  const tenWeeksAgo = startOfDay(subWeeks(now, 10))

  const [weightLogs, dailyLogs, habits] = userId
    ? await Promise.all([
        prisma.weightLog.findMany({
          where: { userId },
          orderBy: { loggedAt: 'desc' },
          take: 30,
        }),
        prisma.dailyLog.findMany({
          where: { userId, date: { gte: tenWeeksAgo } },
          orderBy: { date: 'asc' },
          select: { date: true, consistencyScore: true, waterIntake: true, waistCm: true, bodyFatPct: true },
        }),
        prisma.habit.findMany({
          where: { userId, isActive: true },
          select: { id: true, name: true, streak: true, bestStreak: true, color: true },
        }),
      ])
    : [[], [], []]

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
          Progresso
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Acompanha o teu progresso ao longo do tempo.
        </p>
      </div>

      <ProgressClient
        weightLogs={(weightLogs as { id: string; weight: number; unit: string; loggedAt: Date; notes: string | null }[]).map((w) => ({
          id: w.id,
          weight: w.weight,
          unit: w.unit,
          loggedAt: w.loggedAt.toISOString(),
          notes: w.notes,
        }))}
        dailyLogs={(dailyLogs as { date: Date; consistencyScore: number; waterIntake: number; waistCm: number | null; bodyFatPct: number | null }[]).map((d) => ({
          date: d.date.toISOString(),
          consistencyScore: d.consistencyScore,
          waterIntake: d.waterIntake,
          waistCm: d.waistCm,
          bodyFatPct: d.bodyFatPct,
        }))}
        habits={habits as { id: string; name: string; streak: number; bestStreak: number; color: string }[]}
      />
    </div>
  )
}
