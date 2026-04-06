export interface DisciplineInput {
  habitsCompleted: number
  habitsTotal: number
  trainingCompleted: boolean
  fastingCompleted: boolean
  waterIntake: number // liters
}

export interface DisciplineResult {
  score: number
  message: string
  level: 'perfect' | 'good' | 'risk' | 'fail'
}

export function calculateDisciplineScore(input: DisciplineInput): DisciplineResult {
  // Novo utilizador sem nenhuma actividade configurada ainda
  const noActivity =
    input.habitsTotal === 0 &&
    !input.trainingCompleted &&
    !input.fastingCompleted &&
    input.waterIntake < 0.1
  if (noActivity) {
    return {
      score: 0,
      message: 'Define os teus hábitos e começa a construir a tua disciplina.',
      level: 'risk',
    }
  }

  const habitScore = input.habitsTotal > 0 ? (input.habitsCompleted / input.habitsTotal) * 50 : 50
  const trainingScore = input.trainingCompleted ? 25 : 0
  const fastingScore = input.fastingCompleted ? 15 : 0
  const waterScore = input.waterIntake >= 2.5 ? 10 : (input.waterIntake / 2.5) * 10
  const score = Math.round(habitScore + trainingScore + fastingScore + waterScore)

  if (score >= 90) return { score, message: 'Execução perfeita. Mantém o ritmo.', level: 'perfect' }
  if (score >= 75)
    return {
      score,
      message: `${input.habitsCompleted} de ${input.habitsTotal} hábitos completos. Bom trabalho.`,
      level: 'good',
    }
  if (score >= 60) return { score, message: 'Estás em risco. Ainda dá para recuperar hoje.', level: 'risk' }
  return {
    score,
    message: 'Não executaste hoje. Sem desculpas. Começa já.',
    level: 'fail',
  }
}
