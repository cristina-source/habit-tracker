import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)

  const [todayLog, history] = await Promise.all([
    prisma.dailyLog.findFirst({
      where: { userId, date: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    }),
  ])

  return NextResponse.json({ today: todayLog, history })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v2] — Rate limit: max 30 writes/min por user
  const rl = checkRateLimit(`daily-log:${session.user.id}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const userId = session.user.id
  const body = await req.json()
  const { waterIntake, steps, mood, notes, consistencyScore, date, waistCm, bodyFatPct } = body

  const targetDate = date ? startOfDay(new Date(date)) : startOfDay(new Date())

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date: targetDate } },
    create: {
      userId,
      date: targetDate,
      waterIntake: waterIntake ?? 0,
      steps: steps ?? 0,
      mood: mood ?? null,
      notes: notes ?? null,
      consistencyScore: consistencyScore ?? 0,
      waistCm: waistCm ?? null,
      bodyFatPct: bodyFatPct ?? null,
    },
    update: {
      waterIntake: waterIntake !== undefined ? waterIntake : undefined,
      steps: steps !== undefined ? steps : undefined,
      mood: mood !== undefined ? mood : undefined,
      notes: notes !== undefined ? notes : undefined,
      consistencyScore: consistencyScore !== undefined ? consistencyScore : undefined,
      waistCm: waistCm !== undefined ? waistCm : undefined,
      bodyFatPct: bodyFatPct !== undefined ? bodyFatPct : undefined,
    },
  })

  return NextResponse.json(log)
}
