import { toDisplayCase } from '@/lib/formatters'
import type { PublicCar } from '@/lib/showcase/types'

interface SpecRow {
  label: string
  value: string | null
}

// Year, condition, mileage and state are the car page's spec grid, so this
// list carries the rest.
function buildSpecRows(car: PublicCar): SpecRow[] {
  return [
    { label: 'Body type', value: toDisplayCase(car.body_type) || null },
    { label: 'Engine layout', value: car.engine_layout },
    { label: 'Transmission', value: toDisplayCase(car.transmission) || null },
    { label: 'Drivetrain', value: toDisplayCase(car.drivetrain) || null },
    { label: 'Fuel type', value: toDisplayCase(car.fuel_type) || null },
    { label: 'Exterior', value: toDisplayCase(car.exterior_colour) || null },
    { label: 'Interior', value: toDisplayCase(car.interior_colour) || null },
  ].filter((row): row is SpecRow => Boolean(row.value))
}

export function SpecList({ car }: { car: PublicCar }) {
  const rows = buildSpecRows(car)
  if (rows.length === 0) return null

  return (
    <dl className="divide-y divide-hairline border-y border-hairline">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="shrink-0 font-body text-body text-text-muted">{row.label}</dt>
          <dd className="min-w-0 break-words text-right font-body font-semibold text-body text-ink">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
