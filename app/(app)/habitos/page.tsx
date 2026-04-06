import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { HabitsList } from './habits-list'

export default async function HabitosPage() {
  const session = await auth()
  const userId = session?.user?.id

  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  const weekStart = startOfDay(subDays(today, 6))

  const [habits, completionsToday, freezesToday, freezesThisMonth, completionsWeek] = userId
    ? await Promise.all([
        prisma.habit.findMany({
          where: { userId, isActive: true },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        }),
        prisma.habitCompletion.findMany({
          where: { userId, completedAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.habitFreeze.findMany({
          where: { userId, frozenDate: dayStart },
          select: { habitId: true },
        }),
        prisma.habitFreeze.groupBy({
          by: ['habitId'],
          where: { userId, frozenDate: { gte: monthStart, lte: monthEnd } },
          _count: { id: true },
        }),
        // [ITERATE v2] — últimos 7 dias de completions para dots
        prisma.habitCompletion.findMany({
          where: { userId, completedAt: { gte: weekStart, lte: dayEnd } },
          select: { habitId: true, completedAt: true },
        }),
      ])
    : [[], [], [], [], []]

  const completedIds = new Set((completionsToday as { habitId: string }[]).map((c) => c.habitId))
  const frozenTodayIds = new Set((freezesToday as { habitId: string }[]).map((f) => f.habitId))
  const freezeCountByHabit = Object.fromEntries(
    (freezesThisMonth as { habitId: string; _count: { id: number } }[]).map((f) => [f.habitId, f._count.id])
  )

  // [ITERATE v2] — Agrupar completions da semana por habitId → lista de datas ISO
  const weekCompletionsByHabit: Record<string, string[]> = {}
  for (const c of completionsWeek as { habitId: string; completedAt: Date }[]) {
    const d = startOfDay(c.completedAt).toISOString()
    if (!weekCompletionsByHabit[c.habitId]) weekCompletionsByHabit[c.habitId] = []
    weekCompletionsByHabit[c.habitId].push(d)
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
            Hábitos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {completedIds.size}/{habits.length} completos hoje
          </p>
        </div>
      </div>

      <HabitsList
        habits={habits}
        completedIds={[...completedIds]}
        frozenTodayIds={[...frozenTodayIds]}
        freezeCountByHabit={freezeCountByHabit}
        weekCompletionsByHabit={weekCompletionsByHabit}
      />
    </div>
  )
}
