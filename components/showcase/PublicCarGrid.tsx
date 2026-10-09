import { PublicCarCard } from './PublicCarCard'
import { CarRail } from './CarRail'
import { formatCarTitle } from '@/lib/formatters'
import type { PublicCarCardData } from '@/lib/showcase/types'

interface PublicCarGridProps {
  cars: PublicCarCardData[]
  siteOrigin: string
  autoAdvance?: boolean
  emptyMessage?: string
}

// Below md a swipe row of 300px cards with the next one peeking; from md up a
// grid. The cards stay server-rendered; CarRail adds the scrolling behaviour.
export function PublicCarGrid({
  cars,
  siteOrigin,
  autoAdvance = false,
  emptyMessage = 'No cars listed right now.',
}: PublicCarGridProps) {
  if (cars.length === 0) {
    return <p className="font-body text-body text-text-muted py-12">{emptyMessage}</p>
  }

  return (
    <CarRail labels={cars.map((car) => formatCarTitle(car))} autoAdvance={autoAdvance}>
      {cars.map((car) => (
        <li key={car.id} className="w-[300px] shrink-0 snap-start md:w-auto">
          <PublicCarCard car={car} siteOrigin={siteOrigin} />
        </li>
      ))}
    </CarRail>
  )
}
