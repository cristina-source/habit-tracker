import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 200, fat: 65 }

export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nutritionGoals: true },
  })

  const goals = (user?.nutritionGoals as Record<string, number> | null) ?? DEFAULT_GOALS
  return NextResponse.json(goals)
}

export async function PUT(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const goals = {
    calories: Math.max(500, Math.min(10000, parseInt(body.calories) || DEFAULT_GOALS.calories)),
    protein: Math.max(10, Math.min(500, parseInt(body.protein) || DEFAULT_GOALS.protein)),
    carbs: Math.max(10, Math.min(500, parseInt(body.carbs) || DEFAULT_GOALS.carbs)),
    fat: Math.max(10, Math.min(300, parseInt(body.fat) || DEFAULT_GOALS.fat)),
  }

  await prisma.user.update({
    where: { id: userId },
    data: { nutritionGoals: goals },
  })

  return NextResponse.json(goals)
}
