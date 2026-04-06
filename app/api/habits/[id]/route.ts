import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 30 updates/min per user
  const rl = checkRateLimit(`habits-patch:${session.user.id}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const { id } = await params
  const body = await req.json()

  const habit = await prisma.habit.findUnique({ where: { id } })
  if (!habit || habit.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // [ITERATE v4] — Input sanitization on PATCH
  const patchedName = typeof body.name === 'string' ? body.name.trim().slice(0, 100) || habit.name : habit.name
  const patchedCategory = typeof body.category === 'string' ? body.category.trim().slice(0, 50) || habit.category : habit.category

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      name: patchedName,
      category: patchedCategory,
      color: body.color ?? habit.color,
      type: body.type ?? habit.type,
      target: body.target !== undefined ? body.target : habit.target,
      unit: typeof body.unit === 'string' ? body.unit.trim().slice(0, 20) : (body.unit !== undefined ? body.unit : habit.unit),
      isActive: body.isActive ?? habit.isActive,
      order: body.order ?? habit.order,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 10 deletes/min per user
  const rl = checkRateLimit(`habits-delete:${session.user.id}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const { id } = await params

  const habit = await prisma.habit.findUnique({ where: { id } })
  if (!habit || habit.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.habit.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
