import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY não está definida nas variáveis de ambiente')
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)')
  return buf
}

type GoogleTokens = {
  access_token?: string
  refresh_token?: string
  expires_at?: number
}

/**
 * Encripta um objecto de tokens Google para guardar na BD.
 * Formato de saída: { enc: "iv:authTag:ciphertext" }
 */
export function encryptTokens(tokens: GoogleTokens): { enc: string } {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const plaintext = JSON.stringify(tokens)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  const payload = [iv, authTag, encrypted].map((b) => b.toString('base64')).join(':')
  return { enc: payload }
}

/**
 * Desencripta o campo googleTokens vindo da BD.
 * Suporta formato encriptado { enc: "..." } e legacy plaintext (transição segura).
 */
export function decryptTokens(raw: unknown): GoogleTokens | null {
  if (!raw) return null

  // Formato encriptado
  if (typeof raw === 'object' && raw !== null && 'enc' in raw) {
    try {
      const key = getKey()
      const [ivB64, authTagB64, dataB64] = (raw as { enc: string }).enc.split(':')
      const iv = Buffer.from(ivB64, 'base64')
      const authTag = Buffer.from(authTagB64, 'base64')
      const data = Buffer.from(dataB64, 'base64')
      const decipher = createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
      return JSON.parse(decrypted.toString('utf8')) as GoogleTokens
    } catch {
      return null
    }
  }

  // Formato legacy (plaintext JSON) — transição segura
  if (typeof raw === 'object') {
    return raw as GoogleTokens
  }

  return null
}
