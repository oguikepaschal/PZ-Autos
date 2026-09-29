import type { Metadata } from 'next'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicCarGrid } from '@/components/showcase/PublicCarGrid'
import { getPublicCars } from '@/lib/showcase/queries'

export const metadata: Metadata = {
  title: 'All cars',
  description: 'Verified cars sourced from vetted dealerships and individuals across Lagos.',
}

export const revalidate = 0

export default async function CarsPage() {
  const cars = await getPublicCars()

  return (
    <>
      <PublicHeader />
      <div className="container-page py-12 md:py-section">
        <h1 className="font-display font-black text-h2 tracking-display text-ink">
          Every car currently on offer
        </h1>
        {/* The count matters most below md, where the list is a swipe row
            and the total isn't visible at a glance. */}
        {cars.length > 0 && (
          <p className="mt-2 font-body text-body text-text-muted">
            {cars.length === 1 ? '1 car' : `${cars.length} cars`}
          </p>
        )}
        <div className="mt-8">
          <PublicCarGrid cars={cars} />
        </div>
      </div>
    </>
  )
}
