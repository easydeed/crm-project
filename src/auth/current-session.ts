import { cookies } from 'next/headers'
import { readSessionValue, SESSION_COOKIE } from '@/auth/session'

export async function readRequestSession() {
  const jar = await cookies()
  return readSessionValue(jar.get(SESSION_COOKIE)?.value)
}
