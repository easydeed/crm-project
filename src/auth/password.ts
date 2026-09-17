import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  passwordMeetsRequirements,
} from '@/auth/password-rules'

const N = 16384
const r = 8
const p = 1
const KEY_LEN = 32

function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
}

let dummyHash: string | null = null

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, KEY_LEN, { N, r, p })
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    await hashPassword(password)
    return false
  }
  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts
  const salt = Buffer.from(saltRaw, 'base64url')
  const expected = Buffer.from(hashRaw, 'base64url')
  const actual = await scrypt(password, salt, expected.length, {
    N: Number(nRaw),
    r: Number(rRaw),
    p: Number(pRaw),
  })
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

export async function verifyPasswordOrDummy(password: string, stored: string | null) {
  if (stored) return verifyPassword(password, stored)
  dummyHash ??= await hashPassword('timing-dummy-not-a-login')
  await verifyPassword(password, dummyHash)
  return false
}
