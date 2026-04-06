import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding Habit Tracker demo data...")

  const user = await prisma.user.upsert({
    where: { email: "dev@disciplina.local" },
    update: {},
    create: {
      id: "dev-preview",
      email: "dev@disciplina.local",
      name: "Dev Preview",
      emailVerified: new Date(),
    },
  })

  // 6 Hábitos demo
  const habits = await Promise.all([
    prisma.habit.upsert({
      where: { id: "habit-seed-1" },
      update: {},
      create: {
        id: "habit-seed-1",
        userId: user.id,
        name: "Meditação matinal",
        category: "Bem-estar",
        type: "toggle",
        streak: 12,
        bestStreak: 21,
        color: "#C8FF3E",
        order: 1,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-seed-2" },
      update: {},
      create: {
        id: "habit-seed-2",
        userId: user.id,
        name: "Leitura 30 min",
        category: "Desenvolvimento",
        type: "toggle",
        streak: 7,
        bestStreak: 30,
        color: "#3EFFC8",
        order: 2,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-seed-3" },
      update: {},
      create: {
        id: "habit-seed-3",
        userId: user.id,
        name: "Sem açúcar",
        category: "Alimentação",
        type: "toggle",
        streak: 3,
        bestStreak: 14,
        color: "#FF6B6B",
        order: 3,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-seed-4" },
      update: {},
      create: {
        id: "habit-seed-4",
        userId: user.id,
        name: "Exercício",
        category: "Fitness",
        type: "toggle",
        streak: 5,
        bestStreak: 18,
        color: "#FFB800",
        order: 4,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-seed-5" },
      update: {},
      create: {
        id: "habit-seed-5",
        userId: user.id,
        name: "Dormir antes das 23h",
        category: "Sono",
        type: "toggle",
        streak: 2,
        bestStreak: 10,
        color: "#8B5CF6",
        order: 5,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-seed-6" },
      update: {},
      create: {
        id: "habit-seed-6",
        userId: user.id,
        name: "Cold shower",
        category: "Bem-estar",
        type: "toggle",
        streak: 20,
        bestStreak: 20,
        color: "#00BFFF",
        order: 6,
      },
    }),
  ])

  // Completar 4 hábitos hoje
  const today = new Date()
  today.setHours(8, 0, 0, 0)
  await prisma.habitCompletion.createMany({
    data: [
      { userId: user.id, habitId: habits[0].id, completedAt: today },
      { userId: user.id, habitId: habits[1].id, completedAt: today },
      { userId: user.id, habitId: habits[3].id, completedAt: today },
      { userId: user.id, habitId: habits[5].id, completedAt: today },
    ],
    skipDuplicates: true,
  })

  // Log diário de hoje
  await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: new Date(today) } },
    update: {},
    create: {
      userId: user.id,
      date: today,
      waterIntake: 1.8,
      steps: 8432,
      sleepHours: 7.5,
      restingHR: 58,
      consistencyScore: 75,
    },
  })

  // Sessão de treino hoje
  const trainingDate = new Date()
  trainingDate.setHours(7, 0, 0, 0)
  await prisma.trainingSession.upsert({
    where: { id: "training-seed-1" },
    update: {},
    create: {
      id: "training-seed-1",
      userId: user.id,
      type: "Força — Upper Body",
      scheduledAt: trainingDate,
      completed: true,
      notes: "Treino sólido. PR no supino: 80kg x 5.",
    },
  })

  console.log("Seed completo!")
  console.log(`Hábitos: ${habits.length}`)
  console.log(`Completados hoje: 4`)
  console.log(`Água: 1.8L | Passos: 8.432`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
