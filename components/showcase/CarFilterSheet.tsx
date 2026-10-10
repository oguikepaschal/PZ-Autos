'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { ActionSheet, sheetRowClass } from '@/components/admin/ActionSheet'
import { countActiveFilters } from '@/lib/showcase/carFilters'
import type { CarFilterOptions, CarFilters } from '@/lib/showcase/carFilters'

interface CarFilterSheetProps {
  options: CarFilterOptions
  filters: CarFilters
}

const selectClass =
  'h-12 w-full rounded-xl border border-hairline bg-bg-base px-3 font-body text-[17px] text-ink disabled:opacity-40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 font-body text-[13px] font-semibold text-text-muted">
      {label}
      {children}
    </label>
  )
}

// The one client piece of /cars filtering. It holds a draft while the sheet is
// open and writes the URL on "Show cars"; the page reads the URL on the
// server, so the draft is dropped whenever the sheet closes.
export function CarFilterSheet({ options, filters }: CarFilterSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const active = countActiveFilters(filters)

  function openSheet() {
    setDraft(filters)
    setOpen(true)
  }

  function apply() {
    const params = new URLSearchParams()
    if (draft.make) params.set('make', draft.make)
    if (draft.make && draft.model) params.set('model', draft.model)
    if (draft.yearFrom !== null) params.set('yearFrom', String(draft.yearFrom))
    if (draft.yearTo !== null) params.set('yearTo', String(draft.yearTo))
    const query = params.toString()
    router.push(query ? `/cars?${query}` : '/cars', { scroll: false })
    setOpen(false)
  }

  const modelsForDraft = options.modelsByMake[draft.make] ?? []
  const yearValue = (year: number | null) => (year === null ? '' : String(year))
  const toYear = (value: string) => (value ? Number(value) : null)

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-4 font-body text-body font-semibold text-ink active:bg-fill"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        Filters
        {active > 0 && (
          <span
            aria-label={`${active} active`}
            className="inline-flex size-5 items-center justify-center rounded-full bg-signal-red font-body text-xs font-bold text-white"
          >
            {active}
          </span>
        )}
      </button>

      <ActionSheet open={open} onClose={() => setOpen(false)} title="Filter cars">
        <div className="flex flex-col gap-3 p-4">
          <Field label="Make">
            <select
              value={draft.make}
              onChange={(e) => setDraft({ ...draft, make: e.target.value, model: '' })}
              className={selectClass}
            >
              <option value="">Any make</option>
              {options.makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Model">
            <select
              value={draft.model}
              disabled={!draft.make}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              className={selectClass}
            >
              <option value="">{draft.make ? 'Any model' : 'Pick a make first'}</option>
              {modelsForDraft.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year from">
              <select
                value={yearValue(draft.yearFrom)}
                onChange={(e) => setDraft({ ...draft, yearFrom: toYear(e.target.value) })}
                className={selectClass}
              >
                <option value="">Any year</option>
                {options.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year to">
              <select
                value={yearValue(draft.yearTo)}
                onChange={(e) => setDraft({ ...draft, yearTo: toYear(e.target.value) })}
                className={selectClass}
              >
                <option value="">Any year</option>
                {options.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button
            type="button"
            onClick={apply}
            className="mt-1 h-12 rounded-full bg-ink font-body text-body font-semibold text-ink-inverse"
          >
            Show cars
          </button>
        </div>
        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              router.push('/cars', { scroll: false })
              setOpen(false)
            }}
            className={sheetRowClass}
          >
            Clear filters
          </button>
        )}
      </ActionSheet>
    </>
  )
}
