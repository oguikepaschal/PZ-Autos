import Link from 'next/link'
import { SectionHeading } from '@/components/showcase/SectionHeading'
import { ABOUT } from '@/lib/siteContent'
import { cn } from '@/lib/utils'

interface AboutBandProps {
  // True when a section sits above it on the page background: the band then
  // opens with a hairline rather than doubling the section padding.
  divided?: boolean
}

// The landing page's short About band. It sits below the inventory so it
// never competes with the hero or the cars, and hands the longer story to
// /about.
export function AboutBand({ divided = false }: AboutBandProps) {
  return (
    <section
      aria-labelledby="about-heading"
      className={cn('container-page', divided ? 'pb-section' : 'py-section')}
    >
      <div
        className={cn(
          'grid gap-8 md:grid-cols-12 md:gap-12',
          divided && 'border-t border-hairline pt-section'
        )}
      >
        <SectionHeading
          id="about-heading"
          eyebrow={ABOUT.eyebrow}
          title={ABOUT.heading}
          className="md:col-span-5"
        />
        <div className="md:col-span-6 md:col-start-7">
          <p className="max-w-measure font-body text-lead text-ink">{ABOUT.lead}</p>
          <p className="mt-4 max-w-measure font-body text-body text-ink">{ABOUT.body}</p>
          <Link
            href="/about"
            className="mt-6 inline-flex min-h-11 items-center font-body text-body font-semibold text-ink underline underline-offset-4"
          >
            {ABOUT.linkLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
