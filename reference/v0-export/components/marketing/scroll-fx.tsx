'use client'

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

function prefersReduced() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Fades + lifts its children into place the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'section'
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReduced()) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return createElement(
    as,
    {
      ref,
      className: cn('reveal-fx', shown && 'reveal-in', className),
      style: { transitionDelay: `${delay}ms` } as CSSProperties,
    },
    children,
  )
}

/** Drifts a decorative layer at a fraction of scroll speed. Background use only. */
export function Parallax({
  children,
  speed = 0.15,
  className,
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReduced()) return
    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const viewH = window.innerHeight || 1
      const center = rect.top + rect.height / 2
      const progress = (center - viewH / 2) / viewH
      el.style.transform = `translate3d(0, ${(-progress * speed * 100).toFixed(2)}px, 0)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [speed])

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}

/**
 * Counts a number up the first time it scrolls into view. The value starts at
 * `target` so the correct number is server-rendered and visible even if JS
 * never runs; the animation resets to 0 on mount and counts back up in view.
 */
export function useCountUp(target: number, ms = 1100) {
  const ref = useRef<HTMLElement | null>(null)
  const [value, setValue] = useState(target)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReduced()) {
      setValue(target)
      return
    }
    let raf = 0
    setValue(0)
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / ms)
          setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [target, ms])

  return { ref, value }
}
