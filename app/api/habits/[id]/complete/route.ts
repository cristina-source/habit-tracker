import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays } from 'date-fns'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v2] — Rate limit: max 60 toggles/min por user
  const rl = checkRateLimit(`complete:${session.user.id}`, { limit: 60, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const { id } = await params
  const userId = session.user.id

  const habit = await prisma.habit.findUnique({ where: { id } })
  if (!habit || habit.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)

  // Check if already completed today
  const existing = await prisma.habitCompletion.findFirst({
    where: {
      habitId: id,
      userId,
      completedAt: { gte: dayStart, lte: dayEnd },
    },
  })

  if (existing) {
    // Toggle off — delete completion
    await prisma.habitCompletion.delete({ where: { id: existing.id } })
    // Decrement streak
    await prisma.habit.update({
      where: { id },
      data: { streak: Math.max(0, habit.streak - 1) },
    })
    return NextResponse.json({ toggled: false })
  }

  // Create completion
  const completion = await prisma.habitCompletion.create({
    data: {
      habitId: id,
      userId,
      completedAt: today,
    },
  })

  // Check if yesterday was frozen (freeze protection)
  const yesterday = startOfDay(subDays(today, 1))
  const frozenYesterday = await prisma.habitFreeze.findFirst({
    where: { habitId: id, userId, frozenDate: yesterday },
  })

  // If streak is 0 but yesterday was frozen, check for completions 2 days ago to restore streak
  let baseStreak = habit.streak
  if (baseStreak === 0 && frozenYesterday) {
    const twoDaysAgo = startOfDay(subDays(today, 2))
    const completionTwoDaysAgo = await prisma.habitCompletion.findFirst({
      where: { habitId: id, userId, completedAt: { gte: twoDaysAgo, lt: yesterday } },
    })
    if (completionTwoDaysAgo) baseStreak = 1
  }

  const newStreak = baseStreak + 1
  await prisma.habit.update({
    where: { id },
    data: {
      streak: newStreak,
      bestStreak: Math.max(habit.bestStreak, newStreak),
    },
  })

  return NextResponse.json({ toggled: true, completion })
}
