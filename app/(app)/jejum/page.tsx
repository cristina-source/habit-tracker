import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { FastingClient } from './fasting-client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function JejumPage() {
  const session = await auth()
  const userId = session?.user?.id

  const [activeFasting, history] = userId
    ? await Promise.all([
        prisma.fastingSession.findFirst({
          where: { userId, completed: false },
          orderBy: { startTime: 'desc' },
        }),
        prisma.fastingSession.findMany({
          where: { userId },
          orderBy: { startTime: 'desc' },
          take: 7,
        }),
      ])
    : [null, []]

  const historyData = (history as { id: string; protocol: string; startTime: Date; endTime: Date | null; completed: boolean }[]).map((s) => ({
    id: s.id,
    protocol: s.protocol,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime?.toISOString() ?? null,
    completed: s.completed,
    formattedDate: format(s.startTime, "d MMM yyyy, HH'h'mm", { locale: ptBR }),
    duration: s.endTime
      ? Math.round((s.endTime.getTime() - s.startTime.getTime()) / 3600000)
      : null,
  }))

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
          Jejum Intermitente
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Rastreia as tuas sessões de jejum e sincroniza com o Google Calendar.
        </p>
      </div>

      <FastingClient
        activeFasting={
          activeFasting
            ? {
                id: activeFasting.id,
                startTime: activeFasting.startTime.toISOString(),
                protocol: activeFasting.protocol as '16:8' | 'OMAD' | '36h',
              }
            : null
        }
        history={historyData}
      />
    </div>
  )
}
