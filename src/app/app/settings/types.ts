export type DetailsState = {
  savedAt?: number
  error?: string
  name?: string
  dre?: string
  phone?: string
}

export type AppearanceState = {
  savedAt?: number
  error?: string
  replyTo?: string
  accentColor?: string
}

export type SendingState = {
  savedAt?: number
  error?: string
  sendDay?: string
  sendTime?: string
  timezone?: string
}
