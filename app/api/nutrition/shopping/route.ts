import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const lists = await prisma.shoppingList.findMany({
    where: { userId: userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(lists)
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, dateRange, items, metadata } = await req.json()
  const list = await prisma.shoppingList.create({
    data: {
      userId: userId,
      name: String(name).trim().slice(0, 100),
      dateRange: String(dateRange),
      metadata: metadata ?? null,
      items: {
        create: (items ?? []).map((item: { ingredient: string; quantity: string; unit?: string; category?: string; sources?: string }) => ({
          ingredient: item.ingredient,
          quantity: item.quantity,
          unit: item.unit ?? null,
          category: item.category ?? null,
          sources: item.sources ?? null,
        })),
      },
    },
    include: { items: true },
  })
  return NextResponse.json(list, { status: 201 })
}
