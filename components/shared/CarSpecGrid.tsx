import { formatMileage, toDisplayCase } from '@/lib/formatters'

interface CarSpecGridProps {
  year: number
  condition: string | null
  mileageKm: number | null
  state: string | null
}

// The four headline spec tiles for a car: Year, Condition, Mileage, State.
// Plain props only, so any surface (public page, admin) can render it. The
// outer mt-5 is part of the grid for now; add a className prop when a second
// caller needs different spacing.
export function CarSpecGrid({ year, condition, mileageKm, state }: CarSpecGridProps) {
  const tiles = [
    { label: 'Year', value: String(year) },
    { label: 'Condition', value: toDisplayCase(condition) || 'Not listed' },
    { label: 'Mileage', value: formatMileage(mileageKm) },
    { label: 'State', value: state?.trim() || 'Not listed' },
  ]

  return (
    <dl className="mt-5 grid grid-cols-2 gap-2.5">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col gap-0.5 rounded-2xl bg-surface p-3.5">
          <dt className="font-body text-[13px] text-text-muted">{tile.label}</dt>
          <dd className="font-body text-[17px] font-semibold text-ink">{tile.value}</dd>
        </div>
      ))}
    </dl>
  )
}
