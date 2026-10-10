import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicCarGrid } from '@/components/showcase/PublicCarGrid'
import { CarFilterSheet } from '@/components/showcase/CarFilterSheet'
import { WhatsAppButton } from '@/components/showcase/WhatsAppButton'
import { getPublicCars } from '@/lib/showcase/queries'
import { applyCarFilters, countActiveFilters } from '@/lib/showcase/carFilters'
import type { SearchParams } from '@/lib/showcase/carFilters'
import { getSiteOrigin } from '@/lib/siteOrigin'

export const metadata: Metadata = {
  title: 'All cars',
  description: 'Verified cars sourced from vetted dealerships and individuals across Lagos.',
}

export const revalidate = 0

export default async function CarsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [allCars, siteOrigin, params] = await Promise.all([getPublicCars(), getSiteOrigin(), searchParams])
  // Options and results both come from the one visible-cars array.
  const { filters, options, cars } = applyCarFilters(allCars, params)
  const filtered = countActiveFilters(filters) > 0

  return (
    <>
      <PublicHeader />
      {/* Below md the floating WhatsApp pill needs its height plus its lift
          and the home-indicator inset kept clear at the end of the page. From
          md up the button sits in the flow under the list. */}
      <div className="container-page pt-8 pb-[calc(112px+env(safe-area-inset-bottom))] md:py-section">
        <p className="font-body text-xs font-bold tracking-[0.24em] text-signal-red">INVENTORY</p>
        <h1 className="mt-2 text-balance font-display text-[clamp(2.5rem,1.17rem+5.93vw,6.5rem)] font-black font-stretch-[118%] uppercase leading-[0.9] tracking-display text-ink">
          Every car currently on offer
        </h1>
        <p className="mt-4 font-body text-caption font-semibold uppercase tracking-[0.12em] text-text-muted md:text-small">
          All checked before listing with direct WhatsApp access
        </p>
        {allCars.length > 0 && (
          <div className="mt-5 flex items-center justify-between gap-4 md:mt-6">
            <p aria-live="polite" className="font-body text-body font-semibold text-ink">
              {cars.length} {cars.length === 1 ? 'car' : 'cars'}
            </p>
            <CarFilterSheet options={options} filters={filters} />
          </div>
        )}
        <div className="mt-4">
          {cars.length === 0 && filtered ? (
            <div className="py-12">
              <p className="font-body text-body text-text-muted">No cars match these filters.</p>
              <Link
                href="/cars"
                className="mt-4 inline-flex h-11 items-center rounded-full border border-hairline px-5 font-body text-body font-semibold text-ink active:bg-fill"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            // Keyed on the filters so the rail starts from its first card
            // whenever the list changes.
            <PublicCarGrid
              key={`${filters.make}|${filters.model}|${filters.yearFrom}|${filters.yearTo}`}
              cars={cars}
              siteOrigin={siteOrigin}
              autoAdvance
            />
          )}
        </div>
        <WhatsAppButton message="Hi, I'd like to talk to you about a car." label="Chat on WhatsApp" />
      </div>
    </>
  )
}
