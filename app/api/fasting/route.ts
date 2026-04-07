import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createFastingEvent } from '@/lib/google-calendar'
import { decryptTokens } from '@/lib/encryption'
import { checkRateLimit } from '@/lib/rate-limit'

const PROTOCOL_HOURS: Record<string, number> = {
  '16:8': 16,
  OMAD: 23,
  '36h': 36,
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const [current, history] = await Promise.all([
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

  return NextResponse.json({ current, history })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 10 sessions/min per user
  const rl = checkRateLimit(`fasting:${session.user.id}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const userId = session.user.id
  const body = await req.json()
  const { protocol = '16:8' } = body

  const startTime = new Date()
  const hours = PROTOCOL_HOURS[protocol] ?? 16
  const endTime = new Date(startTime.getTime() + hours * 3600 * 1000)

  // Use transaction to atomically stop active sessions and create the new one
  const session_ = await prisma.$transaction(async (tx) => {
    await tx.fastingSession.updateMany({
      where: { userId, completed: false },
      data: { completed: true, endTime: new Date() },
    })
    return tx.fastingSession.create({
      data: { userId, protocol, startTime },
    })
  })

  // Try to create Google Calendar event (outside transaction — optional)
  let calEventId: string | undefined
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const tokens = decryptTokens(user?.googleTokens)
    if (tokens?.access_token) {
      calEventId = await createFastingEvent(
        tokens.access_token,
        protocol,
        startTime,
        endTime,
        tokens.refresh_token
      )
      if (calEventId) {
        await prisma.fastingSession.update({
          where: { id: session_.id },
          data: { calEventId },
        })
      }
    }
  } catch {
    // Calendar sync optional — continue without blocking the response
  }

  return NextResponse.json({ ...session_, calEventId }, { status: 201 })
}
