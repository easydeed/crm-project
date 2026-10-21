/** The survey lines behind the navy sections. Decorative, not a claim. */
export function SurveyEtch() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-[15px] tracking-[0.08em] whitespace-nowrap text-mkt-etch"
    >
      <div className="absolute top-[14%] -left-[4%] w-[58%] -rotate-[7deg] border-t border-current pt-1.5">
        N 47°30&apos; E &nbsp;&nbsp; 128.40&apos;
      </div>
      <div className="absolute top-[6%] left-[54%] -rotate-[7deg]">LOT 14 &nbsp;·&nbsp; TRACT NO. 2571</div>
      <div className="absolute top-[64%] -right-[6%] w-[52%] rotate-[5deg] border-t border-current pt-1.5 text-right">
        S 88°10&apos; W &nbsp;&nbsp; 214.60&apos;
      </div>
      <div className="absolute bottom-[9%] left-[4%] w-[38%] rotate-[3deg] border-t border-current pt-1.5">
        N 02°14&apos; W &nbsp;&nbsp; 96.00&apos;
      </div>
      <div className="absolute top-[46%] left-[34%] h-[38%] w-px rotate-[12deg] border-l border-dashed border-current" />
    </div>
  )
}
