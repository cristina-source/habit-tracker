import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// GET — return current token (or create one)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!user.apiToken) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { apiToken: randomBytes(32).toString('hex') },
    })
  }

  return NextResponse.json({ token: user.apiToken })
}

// POST — regenerate token
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { apiToken: randomBytes(32).toString('hex') },
  })

  return NextResponse.json({ token: user.apiToken })
}
