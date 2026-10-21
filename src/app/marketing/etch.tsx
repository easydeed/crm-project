/**
 * The survey lines behind the navy sections. Decorative, not a claim (OR-054).
 *
 * The labels bleed off the section's edges by design, so they are drawn by CSS (`data-etch`, see
 * `.mkt-etch-label` in globals.css), not written as text: they carry nothing to read, and the page's
 * text is what the clipping check measures. Words never go in here; the test holds it to no text.
 */
const LABELS = {
  north: "N 47°30' E \u00a0\u00a0 128.40'",
  lot: 'LOT 14 \u00a0·\u00a0 TRACT NO. 2571',
  south: "S 88°10' W \u00a0\u00a0 214.60'",
  west: "N 02°14' W \u00a0\u00a0 96.00'",
}

export function SurveyEtch() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-[15px] tracking-[0.08em] whitespace-nowrap text-mkt-etch"
    >
      <div data-etch={LABELS.north} className="mkt-etch-label absolute top-[14%] -left-[4%] w-[58%] -rotate-[7deg] border-t border-current pt-1.5" />
      <div data-etch={LABELS.lot} className="mkt-etch-label absolute top-[6%] left-[54%] -rotate-[7deg]" />
      <div data-etch={LABELS.south} className="mkt-etch-label absolute top-[64%] -right-[6%] w-[52%] rotate-[5deg] border-t border-current pt-1.5 text-right" />
      <div data-etch={LABELS.west} className="mkt-etch-label absolute bottom-[9%] left-[4%] w-[38%] rotate-[3deg] border-t border-current pt-1.5" />
      <div className="absolute top-[46%] left-[34%] h-[38%] w-px rotate-[12deg] border-l border-dashed border-current" />
    </div>
  )
}
