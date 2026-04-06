import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const range = searchParams.get('range')

  // Range mode: return daily totals for a date range (e.g. ?range=2026-03-29:2026-04-04)
  if (range) {
    const [start, end] = range.split(':')
    if (!start || !end) return NextResponse.json({ error: 'Invalid range format. Use start:end' }, { status: 400 })
    const logs = await prisma.nutritionLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { date: true, calories: true, protein: true, carbs: true, fat: true },
    })
    const byDate: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {}
    for (const l of logs) {
      if (!byDate[l.date]) byDate[l.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
      byDate[l.date].calories += l.calories
      byDate[l.date].protein += l.protein
      byDate[l.date].carbs += l.carbs
      byDate[l.date].fat += l.fat
    }
    return NextResponse.json(byDate)
  }

  // Single date mode
  const targetDate = date ?? new Date().toISOString().split('T')[0]
  const logs = await prisma.nutritionLog.findMany({
    where: { userId, date: targetDate },
    orderBy: { loggedAt: 'asc' },
  })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rl = checkRateLimit(`nutrition-log:${userId}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) return NextResponse.json({ error: 'Demasiados pedidos.' }, { status: 429 })
  const body = await req.json()
  const { mealName, calories, protein, carbs, fat, mealType, date } = body
  if (!mealName || !calories) return NextResponse.json({ error: 'mealName and calories required' }, { status: 400 })
  const log = await prisma.nutritionLog.create({
    data: {
      userId: userId,
      mealName: String(mealName).trim().slice(0, 100),
      calories: parseInt(calories),
      protein: parseFloat(protein ?? 0),
      carbs: parseFloat(carbs ?? 0),
      fat: parseFloat(fat ?? 0),
      mealType: String(mealType ?? 'other').trim(),
      date: date ?? new Date().toISOString().split('T')[0],
    },
  })
  return NextResponse.json(log, { status: 201 })
}
