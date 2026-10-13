import { SectionHeading } from '@/components/showcase/SectionHeading'
import { PROCESS } from '@/lib/siteContent'
import { cn } from '@/lib/utils'

interface ProcessStepsProps {
  // Whether the block opens with a hairline. Pass false when the content
  // above already ends in one.
  hairline?: boolean
}

// Written out so Tailwind sees each class. The column count follows the
// number of steps, so four or five steps need no layout change.
const COLUMNS: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

// The shared "How buying works" block, rendered on /cars, each car's page and
// /about. A vertical list with the numeral on the left up to lg, then one
// column per step with the numeral on top. Informational only: the page's own
// WhatsApp button stays the one place to start a chat.
export function ProcessSteps({ hairline = true }: ProcessStepsProps) {
  const { eyebrow, heading, steps } = PROCESS

  return (
    <section aria-labelledby="process-heading" className="container-page pb-section">
      <div className={cn('pt-section', hairline && 'border-t border-hairline')}>
        <SectionHeading id="process-heading" eyebrow={eyebrow} title={heading} />

        <ol
          role="list"
          className={cn(
            'mt-10 grid md:mt-12 lg:gap-x-8',
            COLUMNS[steps.length] ?? COLUMNS[4]
          )}
        >
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 border-t border-hairline py-6 md:gap-6 lg:block lg:pb-0"
            >
              <span
                aria-hidden="true"
                className="w-14 shrink-0 font-display text-h1 font-extrabold tabular-nums tracking-display text-ink lg:mb-6 lg:block lg:w-auto"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-h3 font-bold tracking-display text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-measure font-body text-body text-text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
