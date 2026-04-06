import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const log = await prisma.nutritionLog.findUnique({ where: { id } })
  if (!log || log.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.nutritionLog.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
