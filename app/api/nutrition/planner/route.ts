import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart')
  const weekEnd = searchParams.get('weekEnd')
  const plans = await prisma.mealPlan.findMany({
    where: {
      userId: userId,
      ...(weekStart && weekEnd ? { date: { gte: weekStart, lte: weekEnd } } : {}),
    },
    include: { recipe: true },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { recipeId, date, mealSlot, servings } = body
  if (!recipeId || !date || !mealSlot) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const plan = await prisma.mealPlan.create({
    data: { userId: userId, recipeId, date, mealSlot, servings: servings ?? 1 },
    include: { recipe: true },
  })
  return NextResponse.json(plan, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const plan = await prisma.mealPlan.findUnique({ where: { id } })
  if (!plan || plan.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.mealPlan.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
