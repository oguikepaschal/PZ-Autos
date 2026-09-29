import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicCarCard } from '@/components/showcase/PublicCarCard'
import { getFeaturedCars } from '@/lib/showcase/queries'
import { generateWhatsAppLink, getOwnerPhone } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

const OWNER_PHONE = getOwnerPhone()

export const metadata: Metadata = {
  // absolute: this page now sits under the (public) group, so the root
  // layout's "%s | Pazogu Automobiles" template would otherwise apply twice.
  title: { absolute: 'Pazogu Automobiles | Verified cars, direct from the owner' },
}

export const revalidate = 0

export default async function LandingPage() {
  const featured = await getFeaturedCars()

  const whatsappLink = generateWhatsAppLink(
    OWNER_PHONE,
    "Hi, I'd like to talk to you about a car."
  )

  return (
    <>
      <PublicHeader />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {/* Below md the photo sits behind the text under an ink overlay, and
          the section fills the small viewport (svh: never cut off by the
          URL bar, no resize while scrolling). From md up the photo fills
          the right half edge to edge and the section takes content height. */}
      <section className="relative isolate overflow-hidden bg-ink">
        <div className="absolute inset-0 -z-10 md:left-1/2">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            preload
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[70%_center] md:object-center"
          />
          <div className="absolute inset-0 bg-ink/80 md:hidden" />
        </div>

        <div className="container-page flex min-h-[calc(100svh-var(--spacing-header))] flex-col justify-end py-16 md:min-h-0 md:justify-center md:py-section">
          <div className="md:w-1/2 md:pr-12">
            <h1 className="font-display font-black text-h1 tracking-display text-white">
              Cars worth trusting, verified before they reach you.
            </h1>
            <p className="mt-6 max-w-measure font-body text-lead text-white md:text-text-on-dark">
              Sourced from vetted dealerships and individuals across Lagos, checked before
              listing and re-confirmed regularly. You talk to the owner directly on WhatsApp,
              not a call centre.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cars"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-lg bg-signal-red px-6 font-body font-semibold text-body text-white transition active:scale-98"
              >
                Browse cars
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-lg border border-white/40 px-6 font-body font-semibold text-body text-white transition hover:border-white active:scale-98"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured (owner-curated, at most 6) ─────────────────────── */}
      {/* Adapts to the count: 0 hides the section, 1 is a wide single
          feature, 2 is two-up, 3 or more is the grid. */}
      {featured.length > 0 && (
        <section className="container-page py-section">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display font-black text-h2 tracking-display text-ink">
              Handpicked by the owner
            </h2>
            <Link
              href="/cars"
              className="hidden h-11 shrink-0 items-center font-body font-semibold text-small text-ink underline-offset-4 hover:underline md:inline-flex"
            >
              See all cars
            </Link>
          </div>

          {featured.length === 1 ? (
            <PublicCarCard
              car={featured[0]!}
              layout="wide"
              sizes="(min-width: 1200px) 600px, (min-width: 768px) 50vw, 100vw"
            />
          ) : (
            <ul
              className={cn(
                'grid gap-4 md:gap-6',
                featured.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
              )}
            >
              {featured.map((car) => (
                <li key={car.id}>
                  <PublicCarCard
                    car={car}
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                  />
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/cars"
            className="mt-6 inline-flex h-11 items-center font-body font-semibold text-body text-ink underline underline-offset-4 md:hidden"
          >
            See all cars
          </Link>
        </section>
      )}
    </>
  )
}
