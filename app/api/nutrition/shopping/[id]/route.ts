import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  // id here is either shoppingListId (for adding item) or itemId (for toggling)
  if (body.action === 'toggle-item') {
    const item = await prisma.shoppingListItem.findUnique({ where: { id: body.itemId } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = await prisma.shoppingListItem.update({
      where: { id: body.itemId },
      data: { checked: !item.checked },
    })
    return NextResponse.json(updated)
  }
  if (body.action === 'add-item') {
    const list = await prisma.shoppingList.findUnique({ where: { id } })
    if (!list || list.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const item = await prisma.shoppingListItem.create({
      data: {
        shoppingListId: id,
        ingredient: String(body.ingredient).trim(),
        quantity: String(body.quantity),
        unit: body.unit ?? null,
        category: body.category ?? null,
      },
    })
    return NextResponse.json(item, { status: 201 })
  }
  if (body.action === 'clear-checked') {
    const list = await prisma.shoppingList.findUnique({ where: { id } })
    if (!list || list.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.shoppingListItem.deleteMany({ where: { shoppingListId: id, checked: true } })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const list = await prisma.shoppingList.findUnique({ where: { id } })
  if (!list || list.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.shoppingList.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
