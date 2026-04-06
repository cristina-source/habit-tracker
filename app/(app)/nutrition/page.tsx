import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { NutritionOverviewClient } from './nutrition-overview-client'

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 200, fat: 65 }

export default async function NutritionPage() {
  const userId = await getAuthUserId()

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 6 * 24 * 3600000).toISOString().split('T')[0]

  const [logs, savedRecipesCount, user, weekLogs] = await Promise.all([
    userId
      ? prisma.nutritionLog.findMany({
          where: { userId, date: today },
          orderBy: { loggedAt: 'asc' },
        })
      : [],
    userId
      ? prisma.savedRecipe.count({ where: { userId } })
      : 0,
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { nutritionGoals: true } })
      : null,
    userId
      ? prisma.nutritionLog.findMany({
          where: { userId, date: { gte: weekAgo, lte: today } },
          select: { date: true, calories: true, protein: true, carbs: true, fat: true },
        })
      : [],
  ])

  const raw = user?.nutritionGoals as Record<string, number> | null
  const goals = {
    calories: raw?.calories ?? DEFAULT_GOALS.calories,
    protein: raw?.protein ?? DEFAULT_GOALS.protein,
    carbs: raw?.carbs ?? DEFAULT_GOALS.carbs,
    fat: raw?.fat ?? DEFAULT_GOALS.fat,
  }

  const logsData = (logs as { id: string; mealName: string; calories: number; protein: number; carbs: number; fat: number; mealType: string; loggedAt: Date }[]).map(l => ({
    id: l.id,
    mealName: l.mealName,
    calories: l.calories,
    protein: l.protein,
    carbs: l.carbs,
    fat: l.fat,
    mealType: l.mealType,
    loggedAt: l.loggedAt.toISOString(),
  }))

  // Build week data: array of 7 days with totals
  const weekData: { date: string; label: string; calories: number; protein: number; carbs: number; fat: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600000)
    const iso = d.toISOString().split('T')[0]
    const dayLogs = (weekLogs as { date: string; calories: number; protein: number; carbs: number; fat: number }[]).filter(l => l.date === iso)
    weekData.push({
      date: iso,
      label: d.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3),
      calories: dayLogs.reduce((s, l) => s + l.calories, 0),
      protein: dayLogs.reduce((s, l) => s + l.protein, 0),
      carbs: dayLogs.reduce((s, l) => s + l.carbs, 0),
      fat: dayLogs.reduce((s, l) => s + l.fat, 0),
    })
  }

  return <NutritionOverviewClient logs={logsData} today={today} savedRecipesCount={savedRecipesCount} goals={goals} weekData={weekData} />
}
