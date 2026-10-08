'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Car, MoreHorizontal, Search, Star, UserRound } from 'lucide-react'
import { CarRowActions } from '@/components/admin/CarRowActions'
import { ActionSheet, sheetRowClass } from '@/components/admin/ActionSheet'
import { SignOutButton } from '@/components/admin/SignOutButton'
import { WordmarkBadge } from '@/components/theme/Logo'
import { formatNGN, getFreshnessTier } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export interface InventoryRow {
  car: {
    id: string
    status: string
    is_featured: boolean
    last_verified_at: string
  }
  title: string
  price: number
  whatsappTaps: number
  thumbUrl: string | null
  hasPhoto: boolean
  featuredIndex: number
}

type Filter = 'all' | 'stale' | 'critical'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stale', label: 'Needs re-check' },
  { id: 'critical', label: 'Overdue' },
]

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  available: 'Available',
  reserved: 'Reserved',
}

interface InventoryListProps {
  rows: InventoryRow[]
  featuredCount: number
  summary: string
  notice: React.ReactNode
  emptyMessage: React.ReactNode
}

// The phone inventory: large title, search, verification filters and one card
// per car. The data is already loaded for the page, so search and filters run
// on the client with no round trip.
export function InventoryList({ rows, featuredCount, summary, notice, emptyMessage }: InventoryListProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  // The id outlives the open flag so the sheet keeps its content while it
  // animates closed.
  const [sheetCarId, setSheetCarId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const tiers = useMemo(
    () => new Map(rows.map((row) => [row.car.id, getFreshnessTier(row.car.last_verified_at)])),
    [rows]
  )
  const counts = {
    all: rows.length,
    stale: rows.filter((row) => tiers.get(row.car.id) === 'stale').length,
    critical: rows.filter((row) => tiers.get(row.car.id) === 'critical').length,
  }

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const visible = rows.filter(
    (row) =>
      (filter === 'all' || tiers.get(row.car.id) === filter) &&
      terms.every((term) => row.title.toLowerCase().includes(term))
  )
  const sheetRow = rows.find((row) => row.car.id === sheetCarId)

  return (
    <div className="flex flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WordmarkBadge />
          <span className="font-body text-[13px] font-semibold tracking-[0.04em] text-text-muted">ADMIN</span>
        </div>
        <button
          type="button"
          aria-label="Account and sign out"
          onClick={() => setAccountOpen(true)}
          className="glass flex size-11 items-center justify-center rounded-full text-ink"
        >
          <UserRound size={20} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-display">Inventory</h1>
        <p className="font-body text-[15px] text-text-muted">{summary}</p>
      </div>

      {notice}

      <label className="flex h-11 items-center gap-2 rounded-xl bg-fill px-3 text-text-muted">
        <Search size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className="sr-only">Search inventory</span>
        <input
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search make, model or year"
          className="min-h-0 min-w-0 flex-1 appearance-none bg-transparent font-body text-ink outline-none placeholder:text-text-muted"
        />
      </label>

      <div role="group" aria-label="Filter by verification" className="-my-1 flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map(({ id, label }) => {
          const on = filter === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(id)}
              className="flex h-11 shrink-0 items-center"
            >
              <span
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-full px-3.5 font-body text-sm font-semibold transition-colors',
                  on ? 'bg-ink text-ink-inverse' : 'bg-fill text-ink'
                )}
              >
                {label}
                <span className="font-medium opacity-70 tabular-nums">{counts[id]}</span>
              </span>
            </button>
          )
        })}
      </div>

      <ul className="flex flex-col gap-3">
        {visible.map((row) => (
          <li key={row.car.id} className="flex flex-col gap-2.5 rounded-[20px] bg-surface p-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/inventory/${row.car.id}/edit`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px]"
              >
                <span className="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-fill text-text-muted">
                  {row.thumbUrl ? (
                    <Image src={row.thumbUrl} alt="" fill sizes="72px" className="object-cover" />
                  ) : (
                    <Car size={28} strokeWidth={1.5} aria-hidden="true" />
                  )}
                </span>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-body text-base font-semibold leading-tight">{row.title}</span>
                    {row.car.is_featured && (
                      <Star
                        size={15}
                        aria-label="Featured"
                        className="shrink-0 fill-signal-red text-signal-red"
                      />
                    )}
                  </span>
                  <span className="font-display text-[15px] font-bold tracking-[-0.01em] tabular-nums">
                    {formatNGN(row.price)}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[13px] text-text-muted">
                    <span className="rounded-full bg-fill px-2 py-0.5 font-semibold text-ink">
                      {STATUS_LABEL[row.car.status] ?? row.car.status}
                    </span>
                    <span className="tabular-nums">
                      {row.whatsappTaps} WhatsApp {row.whatsappTaps === 1 ? 'tap' : 'taps'}
                    </span>
                    {row.car.is_featured && <span>Featured #{row.featuredIndex + 1}</span>}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                aria-label={`More actions for ${row.title}`}
                onClick={() => {
                  setSheetCarId(row.car.id)
                  setSheetOpen(true)
                }}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink"
              >
                <MoreHorizontal size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="border-t border-hairline pt-2.5">
              <CarRowActions
                car={row.car}
                hasPhoto={row.hasPhoto}
                featuredIndex={row.featuredIndex}
                featuredCount={featuredCount}
                section="verified"
              />
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="rounded-[20px] bg-surface px-4 py-8 text-center font-body text-text-muted">
            {rows.length === 0 ? emptyMessage : 'No cars match.'}
          </li>
        )}
      </ul>

      <ActionSheet
        open={sheetOpen && sheetRow !== undefined}
        onClose={() => setSheetOpen(false)}
        title={sheetRow?.title ?? 'Actions'}
      >
        {sheetRow && (
          <CarRowActions
            car={sheetRow.car}
            hasPhoto={sheetRow.hasPhoto}
            featuredIndex={sheetRow.featuredIndex}
            featuredCount={featuredCount}
            section="status"
            variant="sheet"
            onDone={() => setSheetOpen(false)}
          />
        )}
      </ActionSheet>

      <ActionSheet open={accountOpen} onClose={() => setAccountOpen(false)} title="Account">
        <SignOutButton className={sheetRowClass} />
      </ActionSheet>
    </div>
  )
}
