import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateDisciplineScore } from '@/lib/discipline-engine'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)

  const [habits, completionsToday, activeFasting, dailyLog, trainingSessions] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.habitCompletion.findMany({
      where: { userId, completedAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.fastingSession.findFirst({
      where: { userId, completed: false },
      orderBy: { startTime: 'desc' },
    }),
    prisma.dailyLog.findFirst({
      where: { userId, date: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.trainingSession.findMany({
      where: { userId, scheduledAt: { gte: dayStart, lte: dayEnd } },
    }),
  ])

  const habitsCompleted = completionsToday.length
  const habitsTotal = habits.length
  const waterIntake = dailyLog?.waterIntake ?? 0
  const trainingCompleted = trainingSessions.some((s) => s.completed)
  const fastingCompleted = !!activeFasting

  const discipline = calculateDisciplineScore({
    habitsCompleted,
    habitsTotal,
    trainingCompleted,
    fastingCompleted,
    waterIntake,
  })

  return NextResponse.json({
    habits,
    completedHabitIds: completionsToday.map((c) => c.habitId),
    activeFasting,
    dailyLog,
    trainingSessions,
    discipline,
  })
}
