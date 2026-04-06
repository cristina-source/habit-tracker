import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const mealType = searchParams.get('mealType')
  const favourites = searchParams.get('favourites') === 'true'
  const recipes = await prisma.savedRecipe.findMany({
    where: {
      userId: userId,
      ...(category ? { category } : {}),
      ...(mealType ? { mealType } : {}),
      ...(favourites ? { isFavourite: true } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(recipes)
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const recipe = await prisma.savedRecipe.create({
    data: {
      userId: userId,
      name: String(body.name).trim().slice(0, 150),
      description: body.description ?? null,
      category: String(body.category),
      mealType: String(body.mealType),
      macros: body.macros ?? {},
      ingredients: body.ingredients ?? [],
      instructions: body.instructions ?? [],
      tips: body.tips ?? null,
      tags: body.tags ?? [],
      imageUrl: body.imageUrl ?? null,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(recipe, { status: 201 })
}
