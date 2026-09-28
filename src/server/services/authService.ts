import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { db } from '../db'
import { accounts, sessions } from '../db/schema'
import { eq } from 'drizzle-orm'

export const SESSION_COOKIE = 'omix_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

function derivePassword(password: string, salt: string, cost: number, blockSize: number, parallelization: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, 64, { N: cost, r: blockSize, p: parallelization }, (error, derived) => {
      if (error) {
        reject(error)
        return
      }
      resolve(Buffer.from(derived))
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await derivePassword(password, salt, 16384, 8, 1)
  return `scrypt$16384$8$1$${salt}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const cost = Number(parts[1])
  const blockSize = Number(parts[2])
  const parallelization = Number(parts[3])
  if (![cost, blockSize, parallelization].every((value) => Number.isSafeInteger(value) && value > 0)) return false
  try {
    const actual = await derivePassword(password, parts[4], cost, blockSize, parallelization)
    const expected = Buffer.from(parts[5], 'hex')
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createSession(accountId: string): Promise<string> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000)
  const token = createSessionToken()
  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    accountId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    createdAt: now,
    lastUsedAt: now,
  })
  return token
}

export async function findSession(token: string) {
  const session = await db
    .select({
      session: sessions,
      account: accounts,
    })
    .from(sessions)
    .innerJoin(accounts, eq(accounts.id, sessions.accountId))
    .where(eq(sessions.tokenHash, hashSessionToken(token)))
    .get()
  if (!session) return null
  if (session.session.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, session.session.id))
    return null
  }
  await db
    .update(sessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(sessions.id, session.session.id))
  return session.account
}

export async function revokeSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)))
}
