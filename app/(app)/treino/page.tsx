import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TrainingClient } from './training-client'
import { startOfWeek, endOfWeek, subWeeks, startOfDay } from 'date-fns'

export default async function TreinoPage() {
  const session = await auth()
  const userId = session?.user?.id

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const fourWeeksAgo = startOfDay(subWeeks(now, 4))

  const [thisWeek, allSessions] = userId
    ? await Promise.all([
        prisma.trainingSession.findMany({
          where: { userId, scheduledAt: { gte: weekStart, lte: weekEnd } },
          orderBy: { scheduledAt: 'asc' },
        }),
        prisma.trainingSession.findMany({
          where: { userId, scheduledAt: { gte: fourWeeksAgo } },
          orderBy: { scheduledAt: 'asc' },
        }),
      ])
    : [[], []]

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
          Treino
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Agenda e acompanha as tuas sessões de treino semanal.
        </p>
      </div>

      <TrainingClient
        thisWeek={(thisWeek as { id: string; type: string; scheduledAt: Date; completed: boolean; duration: number | null; notes: string | null }[]).map((s) => ({
          id: s.id,
          type: s.type,
          scheduledAt: s.scheduledAt.toISOString(),
          completed: s.completed,
          duration: s.duration,
          notes: s.notes,
        }))}
        allSessions={(allSessions as { id: string; scheduledAt: Date; completed: boolean; type: string }[]).map((s) => ({
          id: s.id,
          scheduledAt: s.scheduledAt.toISOString(),
          completed: s.completed,
          type: s.type,
        }))}
        weekStart={weekStart.toISOString()}
      />
    </div>
  )
}
