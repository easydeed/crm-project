'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Lock,
  Plus,
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { useLab } from '@/components/lab/lab-store'
import { StateSwitcher, ViewState, type ScreenState } from '@/components/lab/view-state'
import { CAMPAIGN_STATUS_META } from '@/components/lab/campaign-meta'
import { CHANNEL_META, type Campaign, type Channel } from '@/lib/lab-data'
import { Tag } from '@/components/tag'
import { Button } from '@/components/ui/button'
import { LabHeader } from '@/components/lab/lab-nav'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Filter = 'all' | 'email' | 'sms' | 'live' | 'drafts'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'Text' },
  { id: 'live', label: 'Live' },
  { id: 'drafts', label: 'Drafts' },
]

function matches(c: Campaign, f: Filter) {
  if (f === 'all') return true
  if (f === 'email' || f === 'sms') return c.channel === (f as Channel)
  if (f === 'live') return c.status === 'live'
  if (f === 'drafts') return c.status === 'draft'
  return true
}

export function CampaignIndex() {
  const { campaigns, setCampaignStatus, removeCampaign } = useLab()
  const [filter, setFilter] = useState<Filter>('all')
  const [screen, setScreen] = useState<ScreenState>('data')
  const [menuId, setMenuId] = useState<string | null>(null)

  const shown = campaigns.filter((c) => matches(c, filter))

  return (
    <>
      <LabHeader
        title="Campaigns"
        subtitle={
          'Everything that sends, in one place. The monthly note always sends \u2014 the rest is yours to shape.'
        }
        action={
          <Button
            nativeButton={false}
            render={
              <Link href="/lab/campaigns/new">
                <Plus className="size-4" aria-hidden />
                New campaign
              </Link>
            }
            className="h-10"
          />
        }
        cost={
          '3\u20134 weeks. The audience filter builder alone is ~1 week and needs indexed queries across parcels and events.'
        }
      />

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div
            role="group"
            aria-label="Filter campaigns"
            className="flex flex-wrap gap-1.5"
          >
            {FILTERS.map((f) => {
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-[13.5px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
                    active
                      ? 'bg-ink text-white'
                      : 'border border-line bg-white text-muted-foreground hover:text-ink',
                  )}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
          <StateSwitcher value={screen} onChange={setScreen} />
        </div>

        <ViewState
          state={screen}
          emptyTitle="Just the monthly note, for now"
          emptyBody="Everything else is optional. Add a campaign when you want to reach people between notes."
          emptyAction={
            <Button
              nativeButton={false}
              render={
                <Link href="/lab/campaigns/new">
                  Create your first campaign
                </Link>
              }
              className="h-9"
            />
          }
          onRetry={() => setScreen('data')}
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {/* header row */}
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_0.8fr_44px] gap-3 border-b border-line bg-surface px-4 py-2.5 text-[12px] font-[600] uppercase tracking-[0.06em] text-muted-foreground md:grid">
              <span>Campaign</span>
              <span>Audience</span>
              <span>Schedule</span>
              <span>Status</span>
              <span className="sr-only">Actions</span>
            </div>

            <ul>
              {shown.map((c) => (
                <CampaignRow
                  key={c.id}
                  campaign={c}
                  menuOpen={menuId === c.id}
                  onMenu={() => setMenuId(menuId === c.id ? null : c.id)}
                  onPause={() => {
                    setCampaignStatus(c.id, c.status === 'live' ? 'paused' : 'live')
                    setMenuId(null)
                    toast('Status updated')
                  }}
                  onDelete={() => {
                    removeCampaign(c.id)
                    setMenuId(null)
                    toast('Campaign deleted')
                  }}
                />
              ))}
              {shown.length === 0 && (
                <li className="px-4 py-10 text-center text-[14px] text-muted-foreground">
                  No campaigns match this filter.
                </li>
              )}
            </ul>
          </div>
        </ViewState>
      </main>
    </>
  )
}

function CampaignRow({
  campaign: c,
  menuOpen,
  onMenu,
  onPause,
  onDelete,
}: {
  campaign: Campaign
  menuOpen: boolean
  onMenu: () => void
  onPause: () => void
  onDelete: () => void
}) {
  const status = CAMPAIGN_STATUS_META[c.status]
  const ChannelIcon = CHANNEL_META[c.channel].icon
  const openRate =
    c.lastRun && c.lastRun.sent > 0 && c.channel === 'email'
      ? Math.round((c.lastRun.opened / c.lastRun.sent) * 100)
      : null

  return (
    <li className="grid grid-cols-1 items-center gap-2 border-b border-line px-4 py-3 last:border-0 md:grid-cols-[1.6fr_1fr_1fr_0.8fr_44px] md:gap-3">
      {/* name + channel */}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg',
            c.channel === 'sms' ? 'bg-coral-soft text-coral' : 'bg-blue-soft text-blue',
          )}
        >
          <ChannelIcon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {c.locked ? (
              <span className="truncate text-[14.5px] font-[600] text-ink">
                {c.name}
              </span>
            ) : (
              <Link
                href="/lab/campaigns/new"
                className="truncate text-[14.5px] font-[600] text-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                {c.name}
              </Link>
            )}
            {c.locked && (
              <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="Locked" />
            )}
          </div>
          {c.locked ? (
            <p className="text-[12.5px] text-muted-foreground">
              Included in your plan {'\u00b7'} this one always sends
            </p>
          ) : openRate != null ? (
            <p className="text-[12.5px] text-muted-foreground tabular-nums">
              Last run: {c.lastRun!.opened} of {c.lastRun!.sent} opened {'\u00b7'} {openRate}%
            </p>
          ) : c.lastRun ? (
            <p className="text-[12.5px] text-muted-foreground tabular-nums">
              Sent to {c.lastRun.sent}
            </p>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">Never sent</p>
          )}
        </div>
      </div>

      {/* audience */}
      <div className="text-[13.5px] text-ink">
        <span className="md:hidden text-muted-foreground">Audience: </span>
        {c.audienceName}{' '}
        <span className="text-muted-foreground tabular-nums">
          ({c.audienceCount})
        </span>
      </div>

      {/* schedule */}
      <div className="text-[13.5px] text-muted-foreground">{c.schedule}</div>

      {/* status */}
      <div>
        <Tag tone={status.tone} dot={status.dot}>
          {status.label}
        </Tag>
      </div>

      {/* actions */}
      <div className="relative flex justify-end">
        {c.locked ? (
          <span className="grid size-8 place-items-center text-muted-foreground/50">
            <Lock className="size-4" aria-hidden />
          </span>
        ) : (
          <>
            <button
              onClick={onMenu}
              aria-label={`Actions for ${c.name}`}
              aria-expanded={menuOpen}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
                {c.status !== 'sent' && c.status !== 'draft' && (
                  <button
                    onClick={onPause}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13.5px] text-ink hover:bg-surface"
                  >
                    {c.status === 'live' ? (
                      <>
                        <Pause className="size-4" aria-hidden /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-4" aria-hidden /> Resume
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={onDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13.5px] text-coral hover:bg-coral-soft"
                >
                  <Trash2 className="size-4" aria-hidden /> Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  )
}
