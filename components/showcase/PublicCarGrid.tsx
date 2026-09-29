import { PublicCarCard } from './PublicCarCard'
import type { PublicCarCardData } from '@/lib/showcase/types'

interface PublicCarGridProps {
  cars: PublicCarCardData[]
  emptyMessage?: string
}

// Below md the list is one horizontal row that snaps card by card, with the
// next card peeking in so the row reads as swipeable. It bleeds to the
// screen edges by cancelling the container gutter (px-5 = the 20px mobile
// gutter) and keeps its first card aligned to the text column with
// scroll-padding. From md up it becomes a normal grid. Native scroll-snap,
// not a JS carousel: the browser's own physics, no touch-action overrides.
export function PublicCarGrid({ cars, emptyMessage = 'No cars listed right now.' }: PublicCarGridProps) {
  if (cars.length === 0) {
    return <p className="font-body text-body text-text-muted py-12">{emptyMessage}</p>
  }

  return (
    <ul
      aria-label="Cars"
      className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 py-2 scrollbar-hide md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:py-0 lg:grid-cols-3"
    >
      {cars.map((car) => (
        <li key={car.id} className="shrink-0 basis-5/6 snap-start sm:basis-1/2 md:basis-auto">
          <PublicCarCard car={car} />
        </li>
      ))}
    </ul>
  )
}
