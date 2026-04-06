import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_FREEZES_PER_MONTH = 2

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 10 freezes/min per user
  const rl = checkRateLimit(`freeze:${session.user.id}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const { id } = await params
  const userId = session.user.id

  const habit = await prisma.habit.findUnique({ where: { id } })
  if (!habit || habit.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const today = startOfDay(new Date())
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Check if already frozen today
  const existingToday = await prisma.habitFreeze.findFirst({
    where: { habitId: id, userId, frozenDate: today },
  })

  if (existingToday) {
    // Toggle off
    await prisma.habitFreeze.delete({ where: { id: existingToday.id } })
    return NextResponse.json({ frozen: false })
  }

  // Check monthly limit
  const freezesThisMonth = await prisma.habitFreeze.count({
    where: { habitId: id, userId, frozenDate: { gte: monthStart, lte: monthEnd } },
  })

  if (freezesThisMonth >= MAX_FREEZES_PER_MONTH) {
    return NextResponse.json(
      { error: `Limite de ${MAX_FREEZES_PER_MONTH} freezes por mês atingido.` },
      { status: 422 }
    )
  }

  await prisma.habitFreeze.create({
    data: { habitId: id, userId, frozenDate: today },
  })

  return NextResponse.json({ frozen: true, freezesUsed: freezesThisMonth + 1 })
}
