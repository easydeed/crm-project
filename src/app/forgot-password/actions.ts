'use server'

import { requestDemoRecovery } from '@/auth/recovery'

export async function requestRecoveryAction(_previous: { submitted: boolean; link: string | null }, form: FormData) {
  return { submitted: true, link: await requestDemoRecovery(String(form.get('email') ?? '')) }
}
