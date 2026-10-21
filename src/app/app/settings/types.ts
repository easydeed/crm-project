export type DetailsState = {
  savedAt?: number
  /** Details committed even though the related billing change failed. */
  detailsPersisted?: boolean
  error?: string
  name?: string
  dre?: string
  phone?: string
  mlsAgentId?: string
  /** Something the save did beyond saving, said plainly. */
  notice?: string
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
