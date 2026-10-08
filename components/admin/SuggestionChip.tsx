'use client'

import { Check, Plus } from 'lucide-react'

interface SuggestionChipProps {
  label: string
  value: string | null
  // The field's current value, so an accepted chip shows a check.
  current: string
  onAccept: (value: string) => void
}

// A suggestion is never applied on its own — it renders as this chip and only
// reaches the field when the admin taps it, which then goes through the
// field's own state setter like any manual edit. It deliberately keeps showing
// when the field already holds a value: the admin may still want to compare,
// and hiding it would quietly decide for them.
export function SuggestionChip({ label, value, current, onAccept }: SuggestionChipProps) {
  if (!value) return null
  const accepted = current === value

  return (
    <button
      type="button"
      onClick={() => onAccept(value)}
      aria-pressed={accepted}
      aria-label={`Use suggested ${label.toLowerCase()}: ${value}`}
      className="flex h-11 items-center transition-transform active:scale-[0.97]"
    >
      <span className="flex h-10 items-center gap-1.5 rounded-full border border-hairline bg-surface px-3.5 font-body text-sm font-semibold text-ink">
        {accepted ? (
          <Check size={14} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
        )}
        {label}: {value}
      </span>
    </button>
  )
}
