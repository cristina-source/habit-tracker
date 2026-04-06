import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth-helper'
import { calculateDisciplineScore } from '@/lib/discipline-engine'
import { KpiCard } from '@/components/kpi-card'
import { ScoreRing } from '@/components/score-ring'
import { FastingTimerWidget } from './fasting-timer-widget'
import { HabitToggle } from './habit-toggle'
import { WaterWidget } from './water-widget'
import { Zap, Droplets, Clock, CheckSquare, Target, Play, Heart, Footprints, Moon, Flame, TrendingUp, Apple } from 'lucide-react'
import { startOfDay, endOfDay } from 'date-fns'
import Link from 'next/link'

function getGreeting(name: string | null | undefined): string {
  const hour = new Date().getHours()
  const firstName = name?.split(' ')[0] ?? 'Utilizador'
  if (hour < 12) return `Bom dia, ${firstName}`
  if (hour < 18) return `Boa tarde, ${firstName}`
  return `Boa noite, ${firstName}`
}

const levelColors = {
  perfect: '#C8FF3E',
  good: '#3EFFC8',
  risk: '#FFB800',
  fail: '#FF4D4D',
}

const levelLabels = {
  perfect: 'Perfeito',
  good: 'Bom',
  risk: 'Em risco',
  fail: 'Falha',
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id ?? await getAuthUserId()

  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)

  const weekAgo = startOfDay(new Date(today.getTime() - 7 * 24 * 3600000))

  const todayStr = today.toISOString().split('T')[0]

  const [habits, completionsToday, activeFasting, dailyLog, trainingSessions, weekLogs, nutritionLogs] = userId
    ? await Promise.all([
        prisma.habit.findMany({
          where: { userId, isActive: true },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        }),
        prisma.habitCompletion.findMany({
          where: { userId, completedAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.fastingSession.findFirst({
          where: { userId, completed: false },
          orderBy: { startTime: 'desc' },
        }),
        prisma.dailyLog.findFirst({
          where: { userId, date: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.trainingSession.findMany({
          where: { userId, scheduledAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.dailyLog.findMany({
          where: { userId, date: { gte: weekAgo, lte: dayEnd } },
          orderBy: { date: 'desc' },
        }),
        prisma.nutritionLog.findMany({
          where: { userId, date: todayStr },
        }),
      ])
    : [[], [], null, null, [], [], []]

  const nutritionTotals = (nutritionLogs as { calories: number; protein: number; carbs: number; fat: number }[]).reduce(
    (acc, l) => ({ calories: acc.calories + l.calories, protein: acc.protein + l.protein, carbs: acc.carbs + l.carbs, fat: acc.fat + l.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const completedHabitIds = new Set((completionsToday as { habitId: string }[]).map((c) => c.habitId))
  const habitsCompleted = (completionsToday as unknown[]).length
  const habitsTotal = (habits as unknown[]).length
  const waterIntake = (dailyLog as { waterIntake?: number } | null)?.waterIntake ?? 0
  const trainingToday = (trainingSessions as { id: string; type: string; scheduledAt: Date; completed: boolean }[])[0] ?? null

  const disciplineResult = calculateDisciplineScore({
    habitsCompleted,
    habitsTotal,
    trainingCompleted: trainingToday?.completed ?? false,
    fastingCompleted: !!activeFasting,
    waterIntake,
  })

  const levelColor = levelColors[disciplineResult.level]
  const waterPct = Math.min(Math.round((waterIntake / 2.5) * 100), 100)
  const dateLabel = today.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })

  // Weekly insight
  const wLogs = weekLogs as Array<{ consistencyScore: number; date: Date }>
  const avgScore = wLogs.length > 1
    ? Math.round(wLogs.slice(1).reduce((s, l) => s + l.consistencyScore, 0) / (wLogs.length - 1))
    : null
  const todayScore = disciplineResult.score
  const weekInsight = (() => {
    if (avgScore === null) return null
    if (todayScore > avgScore + 10) return { text: `O teu score hoje (${todayScore}) está acima da tua média semanal (${avgScore}). Óptimo ritmo.`, color: 'var(--success)' }
    if (todayScore < avgScore - 15) return { text: `Score abaixo da média desta semana (${avgScore}). Ainda dá para recuperar hoje.`, color: 'var(--warning)' }
    return { text: `Score consistente com a tua média semanal (${avgScore}). Mantém o ritmo.`, color: 'var(--accent)' }
  })()

  type HealthLog = {
    steps: number
    sleepHours: number | null
    restingHR: number | null
    heartRateAvg: number | null
    activeEnergy: number | null
  }
  const healthLog = dailyLog as (HealthLog & { waterIntake: number }) | null
  const hasHealthData = healthLog && (
    (healthLog.steps > 0) ||
    healthLog.sleepHours != null ||
    healthLog.restingHR != null ||
    healthLog.activeEnergy != null
  )

  return (
    <div
      className="stagger-1"
      style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}
    >
      {/* Header */}
      <div className="stagger-1" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            {getGreeting(session?.user?.name)}.
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {dateLabel}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <kbd style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 8px',
            fontFamily: 'ui-monospace, monospace',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            ⌘K <span style={{ color: 'var(--text-disabled)' }}>— Comandos</span>
          </kbd>
        </div>
      </div>

      {/* Mensagem do Dia — logo abaixo do header */}
      <div
        className="stagger-2"
        style={{
          background: `${levelColor}10`,
          border: `1px solid ${levelColor}25`,
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Zap size={16} color={levelColor} style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5, flex: 1 }}>
          {disciplineResult.message}
        </p>
        <span style={{
          fontSize: 11, fontWeight: 700, color: levelColor,
          background: `${levelColor}18`, border: `1px solid ${levelColor}30`,
          borderRadius: 99, padding: '3px 10px', flexShrink: 0,
        }}>
          {levelLabels[disciplineResult.level]}
        </span>
      </div>

      {/* Bento Grid — Hero row */}
      <div className="stagger-3 bento-grid">

        {/* Score card — spans 2 rows, col 1 */}
        <div
          style={{
            gridColumn: '1',
            gridRow: '1 / 3',
            background: 'var(--surface)',
            border: `1px solid ${levelColor}22`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 0 40px ${levelColor}08`,
          }}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 100%, ${levelColor}08, transparent 60%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Score do Dia
          </div>
          <ScoreRing score={disciplineResult.score} size={88} strokeWidth={6} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: levelColor }}>
              {levelLabels[disciplineResult.level]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              {habitsCompleted}/{habitsTotal} hábitos
            </div>
          </div>
        </div>

        {/* Fasting card — col 2, row 1 */}
        <div
          style={{
            gridColumn: '2',
            gridRow: '1',
            background: 'var(--surface)',
            border: `1px solid ${activeFasting ? 'rgba(200,255,62,0.15)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Jejum
            </span>
            <Clock size={14} color="var(--text-muted)" />
          </div>
          {activeFasting ? (
            <FastingTimerWidget
              startTime={activeFasting.startTime.toISOString()}
              protocol={activeFasting.protocol as '16:8' | 'OMAD' | '36h'}
            />
          ) : (
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-muted)' }}>Inactivo</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Sem jejum activo
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: activeFasting ? 'linear-gradient(90deg, var(--accent)40, transparent)' : 'transparent' }} />
        </div>

        {/* Water card — col 3, row 1 (interactive widget) */}
        <WaterWidget initialWater={waterIntake} goal={2.5} />

        {/* Habits done — col 4, row 1 */}
        <KpiCard
          title="Hábitos Hoje"
          value={`${habitsCompleted}/${habitsTotal}`}
          subtitle={habitsTotal === 0 ? 'Sem hábitos criados' : habitsCompleted === habitsTotal && habitsTotal > 0 ? 'Todos completos!' : `${habitsTotal - habitsCompleted} por completar`}
          icon={<CheckSquare size={14} />}
          animateValue={habitsCompleted}
          accentColor={habitsCompleted === habitsTotal && habitsTotal > 0 ? 'var(--success)' : 'var(--accent)'}
          stagger={4}
          className=""
        />

        {/* Training today — col 2-3, row 2 */}
        <div
          style={{
            gridColumn: '2 / 4',
            gridRow: '2',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {trainingToday ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>🏋️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{trainingToday.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(trainingToday.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: trainingToday.completed ? 'var(--success-bg)' : 'rgba(255,255,255,0.05)',
                color: trainingToday.completed ? 'var(--success)' : 'var(--text-muted)',
              }}>
                {trainingToday.completed ? 'Concluído' : 'Pendente'}
              </span>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Sem treino agendado hoje</div>
                <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>Adiciona um treino em Treino</div>
              </div>
              <Link href="/treino" style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                Ver plano →
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions — col 4, row 2 */}
        <div
          style={{
            gridColumn: '4',
            gridRow: '2',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Acções Rápidas
          </div>
          <Link href="/jejum" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 600,
            color: activeFasting ? 'var(--text-muted)' : '#0A0A0C',
            textDecoration: 'none',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeFasting ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
            border: activeFasting ? '1px solid var(--border)' : 'none',
            transition: 'opacity var(--ease-fast)',
          }}>
            <Clock size={13} /> {activeFasting ? 'Ver Jejum Activo' : 'Iniciar Jejum'}
          </Link>
          <Link href="/treino" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 600,
            color: 'var(--text)',
            textDecoration: 'none',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border)',
            transition: 'background var(--ease-fast)',
          }}>
            <Play size={13} /> Registar Treino
          </Link>
        </div>
      </div>

      {/* Apple Health row */}
      <div className="stagger-3">
        {hasHealthData ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff3b5c, #ff6b35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Heart size={10} color="white" fill="white" />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Apple Health</h2>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 99, padding: '1px 7px',
                }}>Hoje</span>
              </div>
              <Link href="/definicoes" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                Configurar →
              </Link>
            </div>
            <div className="stat-grid-4" style={{ gap: '10px' }}>
              {/* Steps */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Passos</span>
                  <Footprints size={13} color="var(--accent)" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {healthLog!.steps > 0 ? healthLog!.steps.toLocaleString('pt-PT') : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {healthLog!.steps > 0
                    ? healthLog!.steps >= 10000 ? 'Meta atingida!' : `${Math.round((healthLog!.steps / 10000) * 100)}% da meta`
                    : 'Sem dados'}
                </div>
                {healthLog!.steps > 0 && (
                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: 'var(--accent)',
                      width: `${Math.min((healthLog!.steps / 10000) * 100, 100)}%`,
                      borderRadius: 99,
                    }} />
                  </div>
                )}
              </div>

              {/* Sleep */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sono</span>
                  <Moon size={13} color="#8b5cf6" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {healthLog!.sleepHours != null ? `${healthLog!.sleepHours.toFixed(1)}h` : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {healthLog!.sleepHours != null
                    ? healthLog!.sleepHours >= 7.5 ? 'Sono óptimo' : healthLog!.sleepHours >= 6 ? 'Sono aceitável' : 'Sono insuficiente'
                    : 'Sem dados'}
                </div>
                {healthLog!.sleepHours != null && (
                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: '#8b5cf6',
                      width: `${Math.min((healthLog!.sleepHours / 9) * 100, 100)}%`,
                      borderRadius: 99,
                    }} />
                  </div>
                )}
              </div>

              {/* Resting HR */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FC Repouso</span>
                  <Heart size={13} color="#ff3b5c" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {healthLog!.restingHR != null ? `${healthLog!.restingHR} bpm` : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {healthLog!.restingHR != null
                    ? healthLog!.restingHR < 60 ? 'Atlético' : healthLog!.restingHR <= 80 ? 'Normal' : 'Elevado'
                    : 'Sem dados'}
                </div>
                {healthLog!.heartRateAvg != null && (
                  <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>
                    Média: {healthLog!.heartRateAvg} bpm
                  </div>
                )}
              </div>

              {/* Active Energy */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Calorias Activas</span>
                  <Flame size={13} color="#f59e0b" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {healthLog!.activeEnergy != null ? `${Math.round(healthLog!.activeEnergy)} kcal` : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {healthLog!.activeEnergy != null
                    ? healthLog!.activeEnergy >= 500 ? 'Muito activo' : healthLog!.activeEnergy >= 300 ? 'Activo' : 'Pouco activo'
                    : 'Sem dados'}
                </div>
                {healthLog!.activeEnergy != null && (
                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: '#f59e0b',
                      width: `${Math.min((healthLog!.activeEnergy / 800) * 100, 100)}%`,
                      borderRadius: 99,
                    }} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            background: 'var(--surface)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,59,92,0.15), rgba(255,107,53,0.15))',
                border: '1px solid rgba(255,59,92,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Heart size={14} color="#ff3b5c" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Apple Health não configurado</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Liga o teu iPhone para sincronizar passos, sono e dados cardíacos</div>
              </div>
            </div>
            <Link href="/definicoes" style={{
              fontSize: 12, fontWeight: 600, color: 'var(--accent)',
              textDecoration: 'none', padding: '7px 14px',
              background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)',
            }}>
              Configurar →
            </Link>
          </div>
        )}
      </div>

      {/* Weekly Insight */}
      {weekInsight && (
        <div style={{
          background: 'var(--surface)',
          border: `1px solid ${weekInsight.color}22`,
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <TrendingUp size={15} color={weekInsight.color} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, flex: 1 }}>
            {weekInsight.text}
          </p>
          <span style={{
            fontSize: 10, fontWeight: 700, color: weekInsight.color,
            background: `${weekInsight.color}15`,
            border: `1px solid ${weekInsight.color}30`,
            borderRadius: 99, padding: '2px 8px', flexShrink: 0,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Esta semana
          </span>
        </div>
      )}

      {/* Nutrition widget */}
      <div className="stagger-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Apple size={15} color="#22c55e" />
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Nutricao Hoje</h2>
          </div>
          <Link href="/nutrition" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Ver detalhes →
          </Link>
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px',
        }}>
          {nutritionTotals.calories > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{nutritionTotals.calories}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 2000 kcal</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {(nutritionLogs as unknown[]).length} refeicao(es)
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: nutritionTotals.calories > 2000
                    ? 'linear-gradient(90deg, var(--accent), var(--warning))'
                    : 'linear-gradient(90deg, var(--accent), var(--accent2))',
                  width: `${Math.min((nutritionTotals.calories / 2000) * 100, 100)}%`,
                  borderRadius: 99,
                }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>P: <strong style={{ color: 'var(--text)' }}>{nutritionTotals.protein}g</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>H: <strong style={{ color: 'var(--text)' }}>{nutritionTotals.carbs}g</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>G: <strong style={{ color: 'var(--text)' }}>{nutritionTotals.fat}g</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Sem refeicoes registadas hoje</div>
                <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>Regista ou gera uma receita com IA</div>
              </div>
              <Link href="/nutrition/generate" style={{
                fontSize: 12, fontWeight: 600, color: '#0A0A0C',
                background: 'var(--accent)', borderRadius: 'var(--radius-sm)',
                padding: '7px 14px', textDecoration: 'none',
              }}>
                Gerar receita
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Today's habits */}
      <div className="stagger-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Plano de Hoje</h2>
            {habitsTotal > 0 && (
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: habitsCompleted === habitsTotal ? 'var(--success)' : 'var(--text-muted)',
                background: habitsCompleted === habitsTotal ? 'var(--success-bg)' : 'var(--surface2)',
                border: `1px solid ${habitsCompleted === habitsTotal ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                borderRadius: 99,
                padding: '2px 8px',
              }}>
                {habitsCompleted}/{habitsTotal}
              </span>
            )}
          </div>
          <Link href="/habitos" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Gerir hábitos →
          </Link>
        </div>

        {habits.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Target size={24} color="var(--text-muted)" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Ainda sem hábitos criados.</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Começa adicionando o teu primeiro hábito.</p>
            </div>
            <Link href="/habitos" style={{
              marginTop: 4,
              padding: '9px 18px',
              background: 'var(--accent)',
              color: '#0A0A0C',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              transition: 'opacity var(--ease-fast)',
            }}>
              Adicionar hábito
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(habits as Array<{ id: string; name: string; category: string; color: string; streak: number; type: string }>).map((habit) => (
              <HabitToggle
                key={habit.id}
                habit={habit}
                completed={completedHabitIds.has(habit.id)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
