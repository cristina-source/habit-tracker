import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const logs = await prisma.weightLog.findMany({
    where: { userId: session.user.id },
    orderBy: { loggedAt: 'desc' },
    take: 30,
  })

  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 20 logs/min per user
  const rl = checkRateLimit(`weight:${session.user.id}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const body = await req.json()
  const { weight, unit = 'kg', notes } = body

  if (!weight || isNaN(parseFloat(weight))) {
    return NextResponse.json({ error: 'weight is required' }, { status: 400 })
  }

  const log = await prisma.weightLog.create({
    data: {
      userId: session.user.id,
      weight: parseFloat(weight),
      unit,
      notes: notes ?? null,
    },
  })

  return NextResponse.json(log, { status: 201 })
}
