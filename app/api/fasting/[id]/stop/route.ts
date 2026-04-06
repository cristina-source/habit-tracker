import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

const PROTOCOL_HOURS: Record<string, number> = {
  '16:8': 16,
  OMAD: 23,
  '36h': 36,
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 10 stops/min per user
  const rl = checkRateLimit(`fasting-stop:${session.user.id}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const { id } = await params
  const userId = session.user.id

  const fastingSession = await prisma.fastingSession.findUnique({ where: { id } })
  if (!fastingSession || fastingSession.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const endTime = new Date()
  const goalHours = PROTOCOL_HOURS[fastingSession.protocol] ?? 16
  const goalMs = goalHours * 3600 * 1000
  const elapsed = endTime.getTime() - fastingSession.startTime.getTime()
  const completed = elapsed >= goalMs

  const updated = await prisma.fastingSession.update({
    where: { id },
    data: { endTime, completed },
  })

  return NextResponse.json(updated)
}
