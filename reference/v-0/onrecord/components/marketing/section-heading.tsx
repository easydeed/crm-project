export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-[620] uppercase tracking-[0.12em] text-blue">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-balance text-[26px] font-[680] leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
        {title}
      </h2>
    </div>
  )
}
