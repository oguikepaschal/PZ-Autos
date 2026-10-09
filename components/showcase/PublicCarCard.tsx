import Image from 'next/image'
import { CarCardLink } from './CarCardLink'
import { StatusBadge } from './StatusBadge'
import { EnquireLink } from './WhatsAppButton'
import { formatNGN, formatMileage, formatCarTitle, toDisplayCase } from '@/lib/formatters'
import { generateCarEnquiryMessage } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import type { PublicCarCardData } from '@/lib/showcase/types'

interface PublicCarCardProps {
  car: PublicCarCardData
  // For the absolute car link inside the WhatsApp enquiry message.
  siteOrigin: string
  // 'wide' is the single-featured-car layout: photo on one side, details on
  // the other from md up. It stacks like a normal card below md.
  layout?: 'card' | 'wide'
  sizes?: string
}

// The photo and the name each open the car's page; Enquire opens WhatsApp.
// The photo link is a duplicate of the name link, so it stays out of the tab
// order and the accessibility tree.
export function PublicCarCard({
  car,
  siteOrigin,
  layout = 'card',
  sizes = '(min-width: 1024px) 400px, (min-width: 768px) 50vw, 300px',
}: PublicCarCardProps) {
  const title = formatCarTitle(car.make, car.model, car.year)
  const href = `/cars/${car.slug}`
  const price = formatNGN(car.asking_price_ngn)
  const specs = [formatMileage(car.mileage_km), toDisplayCase(car.transmission), toDisplayCase(car.fuel_type)]
    .filter(Boolean)
    .join(' · ')
  const wide = layout === 'wide'

  return (
    <article
      className={cn('flex h-full flex-col overflow-hidden rounded-[22px] bg-surface text-ink', wide && 'md:grid md:grid-cols-2')}
    >
      <CarCardLink
        carId={car.id}
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className={cn('relative block aspect-[10/7] bg-fill', wide && 'md:aspect-auto md:min-h-80')}
      >
        {car.coverImageUrl ? (
          <Image src={car.coverImageUrl} alt="" fill sizes={sizes} className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-body text-caption text-text-muted">
            Photo coming soon
          </span>
        )}
        {car.status !== 'available' && (
          <span className="absolute top-3 left-3">
            <StatusBadge status={car.status} />
          </span>
        )}
      </CarCardLink>

      <div className={cn('flex flex-1 flex-col px-4 pt-2 pb-1.5', wide && 'md:justify-center md:p-10')}>
        <h3 className={cn('font-display font-bold tracking-[-0.01em]', wide ? 'text-h3 md:text-h2' : 'text-lg')}>
          <CarCardLink carId={car.id} href={href} className="inline-flex min-h-11 items-center">
            {title}
          </CarCardLink>
        </h3>
        {specs && <p className="font-body text-sm text-text-muted">{specs}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          <p className={cn('font-display text-lg font-bold tabular-nums', wide && 'md:text-h3')}>{price}</p>
          {car.status !== 'sold' && (
            <EnquireLink
              carId={car.id}
              carTitle={title}
              message={generateCarEnquiryMessage(title, price, `${siteOrigin}${href}`)}
            />
          )}
        </div>
      </div>
    </article>
  )
}
