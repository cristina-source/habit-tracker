import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // [ITERATE v3] — Rate limit: max 10 completes/min per user
  const rl = checkRateLimit(`training-complete:${session.user.id}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados pedidos. Aguarda um momento.' }, { status: 429 })
  }

  const { id } = await params
  const userId = session.user.id

  const trainingSession = await prisma.trainingSession.findUnique({ where: { id } })
  if (!trainingSession || trainingSession.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { duration?: number; notes?: string } = {}
  try { body = await req.json() } catch { /* no body — ok */ }

  const updated = await prisma.trainingSession.update({
    where: { id },
    data: {
      completed: true,
      ...(body.duration != null && { duration: body.duration }),
      ...(body.notes != null && { notes: body.notes }),
    },
  })

  return NextResponse.json(updated)
}
