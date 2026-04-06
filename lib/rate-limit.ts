// [ITERATE v2] — In-memory rate limiter (single-instance; adequado para Vercel serverless por função)
// Para multi-instância em produção, substituir por Redis/Upstash

const store = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  limit: number      // max pedidos
  windowMs: number   // janela em ms
}

export function checkRateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.limit - 1 }
  }

  if (entry.count >= opts.limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: opts.limit - entry.count }
}
