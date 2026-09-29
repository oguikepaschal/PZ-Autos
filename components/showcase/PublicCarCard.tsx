import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from './StatusBadge'
import { formatNGN, formatMileage, formatCarTitle, toDisplayCase } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { PublicCarCardData } from '@/lib/showcase/types'

interface PublicCarCardProps {
  car: PublicCarCardData
  // 'wide' is the single-featured-car layout: photo on one side, details on
  // the other from md up. It stacks like a normal card below md.
  layout?: 'card' | 'wide'
  sizes?: string
}

export function PublicCarCard({
  car,
  layout = 'card',
  sizes = '(min-width: 1024px) 400px, (min-width: 768px) 50vw, 85vw',
}: PublicCarCardProps) {
  const title = formatCarTitle(car.make, car.model, car.year)
  const specs = [
    formatMileage(car.mileage_km),
    toDisplayCase(car.transmission),
    toDisplayCase(car.fuel_type),
  ].filter(Boolean)
  const wide = layout === 'wide'

  return (
    <Link
      href={`/cars/${car.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-lg border border-hairline bg-bg-base text-ink',
        'transition hover:border-text-muted active:scale-99',
        wide && 'md:grid md:grid-cols-2'
      )}
    >
      <div className="relative aspect-4/3 bg-surface">
        {car.coverImageUrl ? (
          <Image src={car.coverImageUrl} alt={title} fill sizes={sizes} className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-body text-caption text-text-muted">Photo coming soon</span>
          </div>
        )}
        {car.status !== 'available' && (
          <div className="absolute top-3 left-3">
            <StatusBadge status={car.status} />
          </div>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col p-4', wide && 'md:justify-center md:p-10')}>
        <h3
          className={cn(
            'font-display font-bold tracking-display text-ink',
            wide ? 'text-h3 md:text-h2' : 'text-body'
          )}
        >
          {title}
        </h3>
        {specs.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Key specs">
            {specs.map((spec) => (
              <li
                key={spec}
                className="rounded-sm bg-surface px-2 py-0.5 font-body text-caption text-text-muted"
              >
                {spec}
              </li>
            ))}
          </ul>
        )}
        <p
          className={cn(
            'mt-auto pt-4 font-body font-semibold text-h3 text-ink tabular-nums',
            wide && 'md:mt-0 md:pt-6 md:text-h2'
          )}
        >
          {formatNGN(car.asking_price_ngn)}
        </p>
      </div>
    </Link>
  )
}
