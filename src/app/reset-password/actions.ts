'use server'

import { resetPassword } from '@/auth/recovery'

export async function resetPasswordAction(_previous: { ok: boolean; message?: string }, form: FormData) {
  return resetPassword(String(form.get('token') ?? ''), String(form.get('password') ?? ''))
}
