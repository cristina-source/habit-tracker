import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const DEV_PREVIEW = process.env.DEV_PREVIEW === 'true' && process.env.NODE_ENV !== 'production'
const DEV_USER_EMAIL = 'preview@disciplina.app'

/**
 * Devolve o userId autenticado.
 * Em DEV_PREVIEW, cria/obtém um utilizador local de desenvolvimento.
 * Em produção, usa sempre a sessão real do NextAuth.
 */
export async function getAuthUserId(): Promise<string | null> {
  if (DEV_PREVIEW) {
    const user = await prisma.user.upsert({
      where: { email: DEV_USER_EMAIL },
      create: { email: DEV_USER_EMAIL, name: 'Preview' },
      update: {},
      select: { id: true },
    })
    return user.id
  }

  const session = await auth()
  return session?.user?.id ?? null
}
