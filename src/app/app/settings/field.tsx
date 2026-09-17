export const fieldClass =
  'mt-1 w-full max-w-sm rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-[15px]" role="alert">
      {message}
    </p>
  )
}

export function Muted({ children }: { children: string }) {
  return <p className="mt-1 text-[15px] text-foreground/70">{children}</p>
}
