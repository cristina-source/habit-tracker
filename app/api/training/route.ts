import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createTrainingEvent } from '@/lib/google-calendar'
import { decryptTokens } from '@/lib/encryption'
import { startOfWeek, endOfWeek } from 'date-fns'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const sessions = await prisma.trainingSession.findMany({
    where: { userId, scheduledAt: { gte: weekStart, lte: weekEnd } },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 20 sessions/min per user
  const rl = checkRateLimit(`training:${session.user.id}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const userId = session.user.id
  const body = await req.json()
  const { type, scheduledAt } = body

  if (!type || !scheduledAt) {
    return NextResponse.json({ error: 'type and scheduledAt are required' }, { status: 400 })
  }

  // Try to create Google Calendar event
  let calEventId: string | undefined
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const tokens = decryptTokens(user?.googleTokens)
    if (tokens?.access_token) {
      calEventId = await createTrainingEvent(
        tokens.access_token,
        type,
        new Date(scheduledAt),
        tokens.refresh_token
      )
    }
  } catch {
    // Calendar sync optional
  }

  const trainingSession = await prisma.trainingSession.create({
    data: {
      userId,
      type,
      scheduledAt: new Date(scheduledAt),
      calEventId,
    },
  })

  return NextResponse.json(trainingSession, { status: 201 })
}
