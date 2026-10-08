'use client'

interface ConstrainedSelectProps {
  name: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  legacyValue?: string | null
}

// A plain <select> restricted to `options` — except when the record being
// edited already holds a value that predates this dropdown. Silently
// dropping that value on load (or refusing to save it back unchanged) would
// look like data loss to the admin, so it's injected as an extra, clearly
// labelled option instead of being discarded.
export function ConstrainedSelect({ name, options, value, onChange, placeholder, legacyValue }: ConstrainedSelectProps) {
  const hasLegacyValue = Boolean(legacyValue) && !options.includes(legacyValue!)

  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-ink"
    >
      <option value="">{placeholder}</option>
      {hasLegacyValue && (
        <option value={legacyValue!}>{legacyValue} (existing value, not in current list)</option>
      )}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
