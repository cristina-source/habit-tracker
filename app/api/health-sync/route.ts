import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

// Called by iOS Shortcut — auth via Bearer token (user's apiToken)
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = auth.slice(7)

  const user = await prisma.user.findUnique({ where: { apiToken: token } })
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const today = startOfDay(new Date())

  // Upsert today's DailyLog with health data
  const data: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof body.steps === 'number')        data.steps = body.steps
  if (typeof body.activeEnergy === 'number') data.activeEnergy = body.activeEnergy
  if (typeof body.restingHR === 'number')    data.restingHR = body.restingHR
  if (typeof body.heartRateAvg === 'number') data.heartRateAvg = body.heartRateAvg
  if (typeof body.sleepHours === 'number')   data.sleepHours = body.sleepHours
  if (typeof body.weight === 'number')       data.weight = body.weight
  if (typeof body.waterIntake === 'number')  data.waterIntake = body.waterIntake
  if (typeof body.sleepQuality === 'string') data.sleepQuality = body.sleepQuality

  await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: data,
    create: {
      userId: user.id,
      date: today,
      steps: typeof body.steps === 'number' ? body.steps : 0,
      activeEnergy: typeof body.activeEnergy === 'number' ? body.activeEnergy : null,
      restingHR: typeof body.restingHR === 'number' ? body.restingHR : null,
      heartRateAvg: typeof body.heartRateAvg === 'number' ? body.heartRateAvg : null,
      sleepHours: typeof body.sleepHours === 'number' ? body.sleepHours : null,
      weight: typeof body.weight === 'number' ? body.weight : null,
      waterIntake: typeof body.waterIntake === 'number' ? body.waterIntake : 0,
      sleepQuality: typeof body.sleepQuality === 'string' ? body.sleepQuality : null,
    },
  })

  // Also log weight separately if provided
  if (typeof body.weight === 'number' && body.weight > 0) {
    await prisma.weightLog.create({
      data: { userId: user.id, weight: body.weight, unit: 'kg', notes: 'Apple Health' },
    })
  }

  return NextResponse.json({ ok: true, synced: Object.keys(data) })
}
