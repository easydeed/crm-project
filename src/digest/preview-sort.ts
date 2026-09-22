export type PreviewDecision = {
  send: boolean
  blocks: string[]
  name: string
}

export function sortPreviewRows<T extends PreviewDecision>(rows: T[]) {
  return [...rows].sort((left, right) => {
    if (left.send !== right.send) return left.send ? 1 : -1
    if (left.blocks.length !== right.blocks.length) {
      return left.blocks.length - right.blocks.length
    }
    return left.name.localeCompare(right.name)
  })
}
