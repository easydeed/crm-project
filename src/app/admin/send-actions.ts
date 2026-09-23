'use server'

import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { adminUnpause, rerunSend } from '@/jobs/rerun-send'

async function adminId(returnTo: string) {
  const session = await readRequestSession()
  if (!session || session.role !== 'admin' || session.viewingAsAccountId) {
    redirect(`/login?returnTo=${returnTo}`)
  }
  return session.accountId
}

export async function rerunSendAction(formData: FormData) {
  const sendId = String(formData.get('sendId') ?? '')
  const admin = await adminId(`/admin/sends/${sendId}`)
  await rerunSend(admin, sendId)
  redirect(`/admin/sends/${sendId}`)
}

export async function adminUnpauseAction(formData: FormData) {
  const targetAccountId = String(formData.get('accountId') ?? '')
  const admin = await adminId('/admin/deliverability')
  await adminUnpause(admin, targetAccountId)
  redirect('/admin/deliverability')
}
