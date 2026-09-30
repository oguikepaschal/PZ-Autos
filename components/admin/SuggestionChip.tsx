'use client'

interface SuggestionChipProps {
  value: string | null
  onAccept: (value: string) => void
}

// A suggestion is never applied on its own — it renders as this chip and only
// reaches the field when the admin taps it, which then goes through the
// field's own state setter like any manual edit. It deliberately keeps showing
// when the field already holds a value: the admin may still want to compare,
// and hiding it would quietly decide for them.
export function SuggestionChip({ value, onAccept }: SuggestionChipProps) {
  if (!value) return null

  return (
    <button
      type="button"
      onClick={() => onAccept(value)}
      className="mt-2 inline-flex min-h-11 items-center rounded-full border border-hairline bg-surface px-4 py-2 font-body text-small text-text-muted hover:text-ink transition-colors text-left"
    >
      Suggested: <span className="mx-1 font-semibold text-ink">{value}</span>(tap to accept)
    </button>
  )
}
