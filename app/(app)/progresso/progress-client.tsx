'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { format, subDays, startOfDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Flame, Trophy, TrendingUp, Scale, Target, Ruler } from 'lucide-react'

interface WeightLog {
  id: string
  weight: number
  unit: string
  loggedAt: string
  notes?: string | null
}

interface DailyLog {
  date: string
  consistencyScore: number
  waterIntake: number
  waistCm?: number | null
  bodyFatPct?: number | null
}

interface Habit {
  id: string
  name: string
  streak: number
  bestStreak: number
  color: string
}

interface Props {
  weightLogs: WeightLog[]
  dailyLogs: DailyLog[]
  habits: Habit[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
      color: 'var(--text)',
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontWeight: '600', color: 'var(--accent)' }}>{payload[0].value}</p>
    </div>
  )
}

function HeatmapCalendar({ dailyLogs }: { dailyLogs: DailyLog[] }) {
  const WEEKS = 14
  const days: { date: Date; score: number | null }[] = []

  for (let i = WEEKS * 7 - 1; i >= 0; i--) {
    const d = startOfDay(subDays(new Date(), i))
    const log = dailyLogs.find((l) => isSameDay(new Date(l.date), d))
    days.push({ date: d, score: log ? log.consistencyScore : null })
  }

  const getColor = (score: number | null) => {
    if (score === null) return 'rgba(255,255,255,0.05)'
    if (score >= 90) return '#C8FF3E'
    if (score >= 70) return 'rgba(200,255,62,0.6)'
    if (score >= 50) return 'rgba(200,255,62,0.35)'
    if (score > 0) return 'rgba(200,255,62,0.15)'
    return 'rgba(255,77,77,0.25)'
  }

  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const monthLabels: string[] = []
  weeks.forEach((week) => {
    const firstDay = week[0]
    const label = format(firstDay.date, 'MMM', { locale: ptBR })
    const prev = monthLabels[monthLabels.length - 1]
    monthLabels.push(prev === label ? '' : label)
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', height: 14, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
              {monthLabels[wi]}
            </div>
            {week.map((day, di) => (
              <div
                key={di}
                title={`${format(day.date, 'd MMM yyyy', { locale: ptBR })} — ${day.score !== null ? `Score: ${Math.round(day.score)}` : 'Sem dados'}`}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: getColor(day.score),
                  transition: 'all 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.transform = 'scale(1.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Menos</span>
        {[null, 20, 50, 75, 95].map((v, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(v) }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Mais</span>
      </div>
    </div>
  )
}

function EmptyChart({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--surface2)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)',
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  )
}

export function ProgressClient({ weightLogs: initialWeightLogs, dailyLogs, habits }: Props) {
  const [weightLogs, setWeightLogs] = useState(initialWeightLogs)
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [loading, setLoading] = useState(false)
  const [bodyMetricsLoading, setBodyMetricsLoading] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const latestWaist = [...dailyLogs].reverse().find((d) => d.waistCm != null)?.waistCm ?? null
  const latestBodyFat = [...dailyLogs].reverse().find((d) => d.bodyFatPct != null)?.bodyFatPct ?? null

  const saveBodyMetrics = async () => {
    if (!waist && !bodyFat) return
    setBodyMetricsLoading(true)
    try {
      await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waistCm: waist ? parseFloat(waist) : undefined,
          bodyFatPct: bodyFat ? parseFloat(bodyFat) : undefined,
        }),
      })
      setWaist('')
      setBodyFat('')
      startTransition(() => router.refresh())
    } finally {
      setBodyMetricsLoading(false)
    }
  }

  const addWeight = async () => {
    if (!weight || isNaN(parseFloat(weight))) return
    setLoading(true)
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parseFloat(weight), unit: 'kg' }),
      })
      if (res.ok) {
        const created = await res.json()
        setWeightLogs((prev) => [created, ...prev.slice(0, 29)])
        setWeight('')
        startTransition(() => router.refresh())
      }
    } finally {
      setLoading(false)
    }
  }

  const chartData = dailyLogs.map((d) => ({
    date: format(new Date(d.date), 'd MMM', { locale: ptBR }),
    score: Math.round(d.consistencyScore),
  }))

  const weightChartData = [...weightLogs].reverse().map((w) => ({
    date: format(new Date(w.loggedAt), 'd MMM', { locale: ptBR }),
    peso: w.weight,
  }))

  const bodyMetricsChartData = dailyLogs
    .filter((d) => d.waistCm != null || d.bodyFatPct != null)
    .map((d) => ({
      date: format(new Date(d.date), 'd MMM', { locale: ptBR }),
      cintura: d.waistCm ?? undefined,
      gordura: d.bodyFatPct ?? undefined,
    }))

  const latestWeight = weightLogs[0]
  const prevWeight = weightLogs[1]
  const weightDelta = latestWeight && prevWeight ? latestWeight.weight - prevWeight.weight : null

  const avgScore = dailyLogs.length > 0
    ? Math.round(dailyLogs.reduce((s, d) => s + d.consistencyScore, 0) / dailyLogs.length)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Peso Actual</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
            {latestWeight ? `${latestWeight.weight} kg` : '—'}
          </div>
          {weightDelta !== null && (
            <div style={{ fontSize: 12, fontWeight: 600, color: weightDelta <= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
              {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg vs anterior
            </div>
          )}
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Score Médio (10 sem.)</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: avgScore !== null ? (avgScore >= 75 ? 'var(--accent)' : avgScore >= 50 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {avgScore !== null ? `${avgScore}` : '—'}
          </div>
          {avgScore !== null && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {avgScore >= 75 ? 'Consistente' : avgScore >= 50 ? 'Melhorável' : 'Em risco'}
            </div>
          )}
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Melhor Streak</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 8 }}>
            {habits.length > 0 ? (
              <>
                <Flame size={20} />
                {Math.max(...habits.map(h => h.bestStreak), 0)}
              </>
            ) : '—'}
          </div>
          {habits.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              dias consecutivos
            </div>
          )}
        </div>
      </div>

      {/* Heatmap de consistência */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Target size={14} color="var(--text-muted)" />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Consistência — últimas 14 semanas</h2>
        </div>
        <HeatmapCalendar dailyLogs={dailyLogs} />
      </div>

      {/* Score chart */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={14} color="var(--text-muted)" />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Score de Disciplina</h2>
        </div>

        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8FF3E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C8FF3E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" stroke="#C8FF3E" strokeWidth={2} fill="url(#scoreGradient)" dot={{ fill: '#C8FF3E', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart
            icon={<TrendingUp size={20} />}
            title="Sem dados suficientes"
            description={`Regista os teus hábitos diariamente durante pelo menos 2 dias\npara ver o gráfico de evolução do score.`}
          />
        )}
      </div>

      {/* Weight section */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scale size={14} color="var(--text-muted)" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Peso Corporal</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="68.5"
              step="0.1"
              style={{ width: '80px', fontSize: 13, padding: '6px 10px' }}
              onKeyDown={(e) => e.key === 'Enter' && addWeight()}
            />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>kg</span>
            <button
              onClick={addWeight}
              disabled={loading}
              style={{
                padding: '7px 14px',
                background: 'var(--accent)',
                color: '#0A0A0C',
                border: 'none',
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              Registar
            </button>
          </div>
        </div>

        {weightChartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weightChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="peso" stroke="#3EFFC8" strokeWidth={2} dot={{ fill: '#3EFFC8', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : weightLogs.length === 0 ? (
          <EmptyChart
            icon={<Scale size={20} />}
            title="Regista o teu peso"
            description="Introduz o teu peso acima para começar a acompanhar a evolução ao longo do tempo."
          />
        ) : null}

        {weightLogs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
            {weightLogs.slice(0, 8).map((w) => (
              <div key={w.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {format(new Date(w.loggedAt), "d MMM, HH'h'mm", { locale: ptBR })}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {w.weight} {w.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body Metrics */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ruler size={14} color="var(--text-muted)" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Medidas Corporais</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{
            background: 'var(--surface2)', borderRadius: 8, padding: '14px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Cintura
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {latestWaist != null ? `${latestWaist} cm` : '—'}
            </div>
          </div>
          <div style={{
            background: 'var(--surface2)', borderRadius: 8, padding: '14px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              % Gordura
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {latestBodyFat != null ? `${latestBodyFat}%` : '—'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Cintura (cm)</label>
            <input
              type="number"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              placeholder="80"
              step="0.5"
              style={{ width: '90px', fontSize: 13, padding: '6px 10px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Gordura (%)</label>
            <input
              type="number"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="18.5"
              step="0.1"
              style={{ width: '90px', fontSize: 13, padding: '6px 10px' }}
            />
          </div>
          <button
            onClick={saveBodyMetrics}
            disabled={bodyMetricsLoading || (!waist && !bodyFat)}
            style={{
              padding: '7px 14px',
              background: 'var(--accent)',
              color: '#0A0A0C',
              border: 'none',
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              opacity: bodyMetricsLoading || (!waist && !bodyFat) ? 0.5 : 1,
            }}
          >
            Registar
          </button>
        </div>

        {bodyMetricsChartData.length > 1 && (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={bodyMetricsChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {bodyMetricsChartData.some((d) => d.cintura != null) && (
                <Line type="monotone" dataKey="cintura" stroke="#3E9FFF" strokeWidth={2} dot={{ fill: '#3E9FFF', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Cintura (cm)" />
              )}
              {bodyMetricsChartData.some((d) => d.gordura != null) && (
                <Line type="monotone" dataKey="gordura" stroke="#FF9F3E" strokeWidth={2} dot={{ fill: '#FF9F3E', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Gordura (%)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Streaks */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={14} color="var(--text-muted)" />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Streaks por Hábito</h2>
        </div>

        {habits.length === 0 ? (
          <EmptyChart
            icon={<Flame size={20} />}
            title="Sem hábitos activos"
            description="Cria hábitos na página Hábitos e começa a construir as tuas sequências diárias."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {habits.sort((a, b) => b.streak - a.streak).map((habit) => {
              const pct = habit.bestStreak > 0 ? Math.min((habit.streak / habit.bestStreak) * 100, 100) : 0
              return (
                <div key={habit.id} style={{
                  padding: '12px 14px',
                  background: 'var(--surface2)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: habit.bestStreak > 0 ? 8 : 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: habit.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{habit.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Flame size={13} color="#C8FF3E" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#C8FF3E', fontVariantNumeric: 'tabular-nums' }}>
                        {habit.streak}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>dias</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                      <Trophy size={11} />
                      <span style={{ fontSize: 11 }}>{habit.bestStreak}</span>
                    </div>
                  </div>
                  {habit.bestStreak > 0 && (
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', background: habit.color, borderRadius: 99,
                        width: `${pct}%`, transition: 'width 0.6s ease',
                      }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
