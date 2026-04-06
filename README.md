# Habit Tracker

A full-featured personal habit tracking application built with Next.js, Prisma, and PostgreSQL. Track daily habits, fasting sessions, training, weight, nutrition, meal plans, and more -- with Google Calendar integration and AI-powered recipe generation.

## Features

- Daily habit tracking with streaks, freezes, and completion history
- Fasting session management
- Training session scheduling with Google Calendar sync
- Weight and body composition logging
- Nutrition logging with macro tracking
- AI recipe generation (via Anthropic Claude)
- Meal planning and shopping list generation
- Google OAuth authentication

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL with Prisma ORM (using `@prisma/adapter-pg`)
- **Auth:** NextAuth v5 (Auth.js) with Google provider
- **AI:** Anthropic SDK for recipe generation
- **UI:** Tailwind CSS 4, Lucide icons, Recharts
- **Language:** TypeScript

## Prerequisites

- Node.js 20+
- PostgreSQL database (e.g. Neon, Supabase, or local)
- Google Cloud project with OAuth 2.0 credentials (Calendar API enabled)
- Anthropic API key (for recipe generation)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in all values in `.env.local`. See `.env.example` for descriptions.

3. **Generate Prisma client and push schema**

   ```bash
   npx prisma generate
   npm run db:push
   ```

4. **Seed the database (optional)**

   ```bash
   npm run db:seed
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   The app runs at [http://localhost:3004](http://localhost:3004).

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Add all environment variables from `.env.example` in the Vercel project settings.
4. Set `NEXTAUTH_URL` to your production domain (e.g. `https://your-app.vercel.app`).
5. Deploy. Vercel will run `prisma generate && next build` automatically.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3004 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed the database |
