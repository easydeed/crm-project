import { fieldClass, mutedClass } from '@/app/app/people/ui'

/** Settings inputs use the shared field class (OR-034); this re-export keeps the forms' imports. */
export { fieldClass }

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-[15px]" role="alert">
      {message}
    </p>
  )
}

export function Muted({ children }: { children: string }) {
  return <p className={`mt-1 ${mutedClass}`}>{children}</p>
}
