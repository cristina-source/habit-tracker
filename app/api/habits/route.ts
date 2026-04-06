import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(habits)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 20 creates/min per user
  const rl = checkRateLimit(`habits-create:${session.user.id}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const body = await req.json()
  const { color, type, target, unit } = body

  // [ITERATE v4] — Input sanitization: trim + max length
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 50) : ''

  if (!name || !category) {
    return NextResponse.json({ error: 'name and category are required' }, { status: 400 })
  }

  const habit = await prisma.habit.create({
    data: {
      userId: session.user.id,
      name,
      category,
      color: color ?? '#C8FF3E',
      type: type ?? 'toggle',
      target: target ?? null,
      unit: unit ?? null,
    },
  })

  return NextResponse.json(habit, { status: 201 })
}
