'use client'

import { useRef, useState, type ReactElement } from 'react'
import Link from 'next/link'
import { Dialog as D } from '@base-ui/react/dialog'
import { Mail, Monitor, Smartphone, X } from 'lucide-react'
import { SampleEmail } from '@/components/digest/sample-email'
import { cn } from '@/lib/utils'

function seg(active: boolean) {
  return cn(
    'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-sans text-[12px] font-[560] transition-colors',
    active ? 'bg-ink text-white' : 'text-muted-foreground hover:text-ink',
  )
}

export function SampleEmailModal({ trigger }: { trigger: ReactElement }) {
  const [phone, setPhone] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <D.Root>
      <D.Trigger render={trigger} />
      <D.Portal>
        <D.Backdrop
          className="fixed inset-0 z-50 backdrop-blur-[6px] duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none"
          style={{ backgroundColor: 'rgba(14,23,41,0.55)' }}
        />
        <D.Popup
          initialFocus={closeRef}
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden bg-surface outline-none duration-200',
            'inset-x-0 bottom-0 top-auto max-h-[92vh] rounded-t-[18px]',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:h-[92vh] sm:w-full sm:max-w-[760px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[18px]',
            'data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-8 sm:data-open:slide-in-from-bottom-3',
            'data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-8 sm:data-closed:slide-out-to-bottom-3',
            'motion-reduce:animate-none',
          )}
        >
          {/* drag handle (mobile sheet) */}
          <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-ink/15 sm:hidden" />

          {/* top bar */}
          <div className="flex items-center justify-between gap-3 border-b border-line bg-background px-4 py-3">
            <D.Title className="flex items-center gap-2 font-sans text-[13px] font-[560] text-ink">
              <Mail className="size-4 text-muted-foreground" />
              Sample {'\u00b7'} what your client receives
            </D.Title>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-line p-0.5">
                <button type="button" onClick={() => setPhone(false)} aria-pressed={!phone} className={seg(!phone)}>
                  <Monitor className="size-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button type="button" onClick={() => setPhone(true)} aria-pressed={phone} className={seg(phone)}>
                  <Smartphone className="size-3.5" />
                  <span className="hidden sm:inline">Phone</span>
                </button>
              </div>
              <D.Close
                render={
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label="Close"
                    className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-line/60 hover:text-ink"
                  />
                }
              >
                <X className="size-4" />
              </D.Close>
            </div>
          </div>

          {/* scrolling email */}
          <div className="relative flex-1 overflow-hidden">
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-ink/10 to-transparent transition-opacity duration-200',
                scrolled ? 'opacity-100' : 'opacity-0',
              )}
            />
            <div
              onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
              className="h-full overflow-y-auto px-4 py-6 sm:px-6"
            >
              <SampleEmail variant="modal" phone={phone} animate />
            </div>
          </div>

          {/* bottom bar */}
          <div className="flex items-center justify-between gap-3 border-t border-line bg-background px-4 py-3">
            <p className="hidden font-sans text-[12px] text-muted-foreground sm:block">
              This is a real render. Every figure traces to a recorded document.
            </p>
            <D.Close
              nativeButton={false}
              render={<Link href="/register" />}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-blue px-4 font-sans text-[14px] font-[620] text-white [a]:hover:bg-blue/90"
            >
              Start for $19 a month
            </D.Close>
          </div>
        </D.Popup>
      </D.Portal>
    </D.Root>
  )
}
