import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const recipe = await prisma.savedRecipe.findUnique({ where: { id } })
  if (!recipe || recipe.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.savedRecipe.update({
    where: { id },
    data: {
      isFavourite: body.isFavourite ?? recipe.isFavourite,
      rating: body.rating !== undefined ? body.rating : recipe.rating,
      notes: body.notes !== undefined ? body.notes : recipe.notes,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const recipe = await prisma.savedRecipe.findUnique({ where: { id } })
  if (!recipe || recipe.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.savedRecipe.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
