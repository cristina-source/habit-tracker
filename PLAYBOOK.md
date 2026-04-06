# PLAYBOOK — Habit Tracker
> Sistema pessoal de tracking de hábitos e saúde
> Última actualização: 2026-04-04

---

## 1. VISÃO GERAL

| Campo | Detalhe |
|-------|---------|
| **Produto** | Aplicação pessoal de tracking: hábitos diários, jejum intermitente, treino, peso, métricas de saúde |
| **Fase** | Protótipo funcional — uso pessoal, single-user |
| **Modelo** | Ferramenta pessoal (sem Stripe/subscrição visível no package.json) |
| **Diferencial** | Integração Google Calendar para sincronizar jejum e treinos + métricas de saúde completas |

---

## 2. STACK TÉCNICA

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.2.1 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS v4 | 4.x |
| ORM | Prisma (output customizado) | 7.6.0 |
| Driver DB | pg (driver directo) + @prisma/adapter-pg | 7.6.0 |
| Base de dados | PostgreSQL | — |
| Autenticação | NextAuth v5 beta | 5.0.0-beta.30 |
| Calendário | Google Calendar API (googleapis) | 171.4.0 |
| Gráficos | Recharts | 3.8.1 |
| Fontes | DM Sans (variável) | — |

**Notas de stack:**
- Sem Stripe (produto pessoal, sem billing)
- Sem Resend (sem emails transaccionais)
- Sem React Hook Form (formulários simples com state)
- Sem Zod (sem validação de esquema)

---

## 3. ARQUITECTURA DE BASE DE DADOS

### Hierarquia (single-user)
```
User
├── Habit[] (hábitos definidos pelo utilizador)
│   └── HabitCompletion[] (completions diárias)
├── FastingSession[] (sessões de jejum com Google Calendar)
├── TrainingSession[] (sessões de treino com Google Calendar)
├── WeightLog[] (registo de peso)
└── DailyLog[] (métricas diárias completas)
    ├── mood, waterIntake, steps, activeEnergy
    ├── restingHeartRate, avgHeartRate
    ├── sleepHours, sleepQuality
    └── consistencyScore
```

### Campos especiais no User
- `googleTokens Json?` — tokens OAuth do Google (acesso + refresh para Calendar API)
- `apiToken String? @unique` — token para acesso externo/automação

### Configuração Prisma não-standard
```prisma
generator client {
  provider = "prisma-client"      ← ERRO: deve ser "prisma-client-js"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // url = env("DATABASE_URL")  ← FALTA URL (como no DogCoach)
}
```

### Padrões aplicados
- ✅ Unique constraint em HabitCompletion(habitId, completedAt)
- ✅ Google Calendar sync flags (calendarSync em Habit, calEventId em FastingSession e TrainingSession)
- ✅ Streak + bestStreak tracked no model Habit (não calculado on-the-fly)
- ✅ DailyLog rico com múltiplas métricas de saúde
- ⚠️ Sem `deletedAt` em nenhum modelo
- ⚠️ Provider Prisma incorrecto ("prisma-client" vs "prisma-client-js")
- ⚠️ Output path customizado pode causar problemas de import

---

## 4. AUTENTICAÇÃO & SEGURANÇA

### Fluxo
- NextAuth v5 com Prisma Adapter (via adapter-pg)
- Provider: Google OAuth (com acesso a Calendar API via tokens)
- Google tokens armazenados como JSON no modelo User
- `apiToken` para acesso externo (automação/shortcuts iOS, etc.)

### Implicações de segurança dos Google tokens
- Os tokens OAuth do Google estão guardados em campo `Json` no User
- Include refresh_token — permite acesso contínuo ao Calendar mesmo sem o utilizador estar online
- **Atenção GDPR:** dados pessoais de calendário requerem consentimento explícito

### Segurança — Estado
- ⚠️ `googleTokens` em texto (não encriptado) na BD
- ⚠️ `apiToken` sem expiração ou rotação
- ⚠️ Sem middleware de autenticação visível no package scan
- ⚠️ Sem AllowedEmail (mas é single-user — menos crítico)
- ⚠️ Sem security headers

---

## 5. DESIGN SYSTEM

### Tokens CSS (globals.css) — melhor sistema entre os projectos dark
```css
/* Backgrounds */
--bg: #0A0A0C              /* ultra dark */
--surface: #111114
--surface2: #18181C
--surface3: #1E1E24

/* Cores semânticas */
--accent: #C8FF3E          /* lime green — brand primary */
--accent2: #3EFFC8         /* teal — secundário */
--accent-dim: rgba(200,255,62,0.12)
--danger: #FF4D4D
--success: #10B981
--warning: #FFB800

/* Texto */
--text: #FFFFFF
--text-secondary: rgba(255,255,255,0.7)
--text-muted: rgba(255,255,255,0.45)
--text-disabled: rgba(255,255,255,0.2)

/* Transições (únicas dos 4 projectos!) */
--ease-fast: 120ms ease
--ease-base: 200ms ease
--ease-slow: 350ms cubic-bezier(0.4,0,0.2,1)
--ease-bounce: 400ms cubic-bezier(0.34,1.56,0.64,1)

/* Radii */
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--radius-xl: 20px
```

### Fontes
- ✅ DM Sans variável (excelente legibilidade)
- `font-variant-numeric: tabular-nums` — números alinhados (perfeito para metrics)

### Acessibilidade no CSS
- ✅ `:focus-visible` com outline no accent color
- ✅ `::selection` com cor de brand
- ✅ Scrollbar custom discreta

### Modo
- Dark mode fixo — adequado para tracking nocturno
- Lime green (#C8FF3E) é uma escolha de branding arrojada e distinta

---

## 6. AUDITORIA SAAS — SCORE: 6/10 (produto pessoal)

*Nota: este produto é single-user/pessoal, não SaaS. Score ajustado ao contexto.*

### 🔴 CRÍTICOS

**C1 — Provider Prisma** — ✅ Verificado: `"prisma-client"` é válido no Prisma 7.x (mudança de "prisma-client-js")

**C2 — datasource sem URL** — ✅ Intencional: `prisma.config.ts` + `PrismaPg` adapter fornecem a URL (mesmo pattern que DogCoach)

**C3 — Google tokens sem encriptação** — ⚠️ Pendente: `googleTokens Json?` guarda refresh_token em texto. Solução: encriptar com AES-256 antes de persistir

**C4 — Scripts em falta** — ✅ Resolvido (2026-04-04): `lint`, `db:push`, `db:studio` adicionados ao `package.json`

**C5 — Security headers** — ✅ Resolvido (2026-04-04): `next.config.ts` com CSP, X-Frame-Options, connect-src Google APIs

### 🟡 IMPORTANTES (melhorar em breve)

**I1 — Output path customizado do Prisma**
- `output = "../app/generated/prisma"` — imports têm de apontar para este caminho
- Impacto: Confusão em imports, diferentes do padrão
- Solução: Remover output customizado ou garantir path alias configurado

**I2 — apiToken sem gestão**
- Sem expiração, rotação ou revogação
- Solução: Adicionar `apiTokenExpiresAt DateTime?` e endpoint de rotação

**I3 — Sem soft deletes**
- Apagar um Habit elimina todo o histórico de completions
- Solução: `deletedAt DateTime?` em Habit, FastingSession, TrainingSession

**I4 — DailyLog sem unique constraint por data**
- Possível criar múltiplos DailyLog para o mesmo dia
- Solução: `@@unique([userId, date])` no modelo DailyLog

### 🟢 MELHORIAS (versão mais rica)

**M1 — Dashboard visual com Recharts**
- Já tem Recharts instalado — implementar gráficos de streak, peso, jejum

**M2 — Streak calendar (heatmap)**
- Visualização de completions estilo GitHub contribution graph

**M3 — Export de dados (CSV/JSON)**
- Privacidade: utilizador deve poder exportar os seus dados

**M4 — Notificações de hábito**
- Reminders diários via Google Calendar (já tem API integrada)

---

## 7. O QUE ESTÁ BEM

- ✅ **Melhor design system dark dos 4 projectos** — tokens de transição únicos, DM Sans, tabular-nums
- ✅ `:focus-visible` implementado correctamente (acessibilidade)
- ✅ Lime green (#C8FF3E) como accent — muito distintivo e energético
- ✅ DailyLog rico com 10+ métricas de saúde
- ✅ Google Calendar sync nativamente no schema (calEventId em sessões)
- ✅ Streak + bestStreak guardados no modelo (não recalculados)
- ✅ Tokens de transição definidos no CSS — consistência de animações
- ✅ `font-variant-numeric: tabular-nums` — detalhe de qualidade para tracking de números

---

## 8. DECISÕES DE ARQUITECTURA

| Decisão | Motivo |
|---------|--------|
| Single-user | Ferramenta pessoal — sem necessidade de multi-tenancy |
| googleTokens no User | Acesso persistente ao Calendar sem re-autenticação |
| apiToken | Automações externas (Shortcuts iOS, scripts) |
| Streak no schema | Performance — evita recalcular sobre N completions |
| Output path customizado Prisma | Provavelmente para compatibilidade com edge runtime |
| Dark mode fixo com lime | Identidade visual arrojada, motivacional |
| DM Sans | Excelente legibilidade em ecrãs de métricas |

---

## 9. AMBIENTE

```bash
# Setup
npm install

# Variáveis necessárias
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Google Calendar precisa de scope adicional:
# https://www.googleapis.com/auth/calendar

# Scripts a adicionar:
# "db:push": "prisma db push"
# "db:studio": "prisma studio"
# "lint": "next lint"

# Dev
npm run dev
```

### Atenção ao output do Prisma
```typescript
// Import deve apontar para path customizado:
import { PrismaClient } from '../app/generated/prisma'
// OU configurar path alias no tsconfig.json
```

---

## 10. ROADMAP SUGERIDO

### Fase 1 — Correcções críticas ✅ CONCLUÍDO (2026-04-04)
- [x] Provider "prisma-client" válido no Prisma 7.x — sem alteração
- [x] URL via prisma.config.ts + adapter — intencional
- [x] Security headers adicionados ao next.config.ts
- [x] Scripts lint, db:push, db:studio adicionados
- [x] @@unique([userId, date]) já existia no DailyLog
- [x] deletedAt adicionado ao modelo Habit
- [x] Encriptar googleTokens — ✅ Resolvido (2026-04-04): AES-256-GCM em `lib/encryption.ts`; `auth.ts` encripta ao guardar; `fasting/route.ts` e `training/route.ts` desencriptam ao ler; suporte a legacy plaintext na transição

### Fase 2 — Feature complete
- [ ] Dashboard com gráficos (Recharts) — streak, peso, jejum
- [ ] Heatmap de hábitos (12 meses)
- [ ] Soft deletes em Habit e sessões
- [ ] Rotação de apiToken com expiração

### Fase 3 — Evoluir para SaaS (se desejado)
- [ ] Multi-user com isolamento de dados
- [ ] Planos de subscrição (Stripe)
- [ ] Onboarding com configuração de hábitos por objectivo (perda de peso, fitness, etc.)
- [ ] Partilha de progresso (público/privado)

---

## 11. ERROS RESOLVIDOS / HISTÓRICO

| Data | Problema | Solução |
|------|---------|---------|
| — | — | — |

*(actualizar após cada sessão de trabalho)*
