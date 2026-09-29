import Link from 'next/link'
import type { Metadata } from 'next'
import { TopContactBar } from '@/components/showcase/TopContactBar'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicFooter } from '@/components/showcase/PublicFooter'
import { PublicCarCard } from '@/components/showcase/PublicCarCard'
import { SectionLabel } from '@/components/showcase/SectionLabel'
import { getFeaturedCars } from '@/lib/showcase/queries'
import { generateWhatsAppLink, getOwnerPhone } from '@/lib/whatsapp'

const OWNER_PHONE = getOwnerPhone()

export const metadata: Metadata = {
  title: 'Pazogu Automobiles — Verified cars, direct from the owner',
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
      <TopContactBar />
      <PublicHeader />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-ink">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05]">
              Cars worth <span className="text-signal-red">trusting</span>,
              <br />
              verified before they reach you.
            </h1>
            <p className="font-body text-text-on-dark text-base md:text-lg mt-6 max-w-md">
              Sourced from vetted dealerships and individuals across Lagos, checked before
              listing, and re-confirmed regularly — with direct WhatsApp access to the owner,
              not a call centre.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link
                href="/cars"
                className="rounded-lg bg-signal-red text-white font-body font-semibold text-sm px-6 py-3.5"
              >
                Browse inventory
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/30 text-white font-body font-semibold text-sm px-6 py-3.5"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden placeholder-stripes" />
        </div>
      </section>

      {/* ── Featured (owner-curated only — no filters) ──────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 md:px-10 py-14 md:py-20">
        <SectionLabel>Featured</SectionLabel>
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display font-black text-2xl md:text-3xl text-ink">
            Handpicked by the owner
          </h2>
          <Link
            href="/cars"
            className="hidden md:inline font-body text-sm font-semibold text-ink hover:underline"
          >
            View all inventory →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="font-body text-text-muted">
            No cars are featured right now — see the full inventory instead.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featured.map((car, index) => (
              <div key={car.id} className={index >= 4 ? 'hidden md:block' : ''}>
                <PublicCarCard car={car} />
              </div>
            ))}
          </div>
        )}

        <Link
          href="/cars"
          className="md:hidden mt-6 inline-block font-body text-sm font-semibold text-ink hover:underline"
        >
          View all inventory →
        </Link>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────────── */}
      {/* Ink, not a signal-red fill — the brand ratio rule explicitly rules
          out a large red fill. WhatsApp stays the section's one red CTA;
          the phone link is the plain secondary (ink-outline-on-dark
          equivalent: white 1px outline). */}
      <section className="bg-ink">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white">
              Serious about a car?
            </h2>
            <p className="font-body text-text-on-dark text-sm mt-1">
              Message the owner directly — no forms, no call centre.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`tel:${OWNER_PHONE}`}
              className="rounded-lg border border-white/30 text-white font-body font-semibold text-sm px-6 py-3"
            >
              {OWNER_PHONE}
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-signal-red text-white font-body font-semibold text-sm px-6 py-3"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
