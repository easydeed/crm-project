export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_REQUIREMENTS = [
  `At least ${PASSWORD_MIN_LENGTH} characters`,
] as const

export function passwordMeetsRequirements(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH
}
