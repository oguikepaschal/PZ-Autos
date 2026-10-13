import { cn } from '@/lib/utils'

type Level = 'h1' | 'h2' | 'h3'

interface SectionHeadingProps {
  title: string
  // The element rendered, and the type step it is set in. Kept apart so a
  // page's single h1 and its h2 sections can share one scale.
  as?: Level
  size?: Level
  eyebrow?: string
  lead?: string
  // 'dark' is for the always-dark surfaces (header, hero, footer).
  tone?: 'light' | 'dark'
  id?: string
  className?: string
}

const SIZE: Record<Level, string> = {
  h1: 'text-h1 font-extrabold',
  h2: 'text-h2 font-extrabold',
  h3: 'text-h3 font-bold',
}

// One heading block for public sections: an optional eyebrow, the heading,
// and an optional lead. Spacing between the three lives here so no section
// re-invents it.
export function SectionHeading({
  title,
  as: Tag = 'h2',
  size = 'h2',
  eyebrow,
  lead,
  tone = 'light',
  id,
  className,
}: SectionHeadingProps) {
  const dark = tone === 'dark'
  return (
    <div className={className}>
      {eyebrow && (
        <p
          className={cn(
            'mb-3 font-body text-caption font-semibold uppercase tracking-widest',
            dark ? 'text-text-on-dark' : 'text-text-muted'
          )}
        >
          {eyebrow}
        </p>
      )}
      <Tag
        id={id}
        className={cn(
          'text-balance font-display tracking-display',
          SIZE[size],
          dark ? 'text-white' : 'text-ink'
        )}
      >
        {title}
      </Tag>
      {lead && (
        <p
          className={cn(
            'mt-4 max-w-measure font-body text-lead',
            dark ? 'text-text-on-dark' : 'text-ink'
          )}
        >
          {lead}
        </p>
      )}
    </div>
  )
}
