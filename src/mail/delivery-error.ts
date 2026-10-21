/** The provider explicitly refused this request: no delivery was accepted. */
export class DeliveryRejectedError extends Error {}

export function definitelyRejected(error: unknown): boolean {
  if (error instanceof DeliveryRejectedError) return true
  const code = (error as { code?: unknown } | null)?.code
  // Postmark's documented validation/recipient errors are explicit refusals.
  return typeof code === 'number' && [300, 400, 401, 402, 403, 405, 406, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 422, 429].includes(code)
}
