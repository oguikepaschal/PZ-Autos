export interface SpecGridItem {
  label: string
  value: string
}

export function SpecGrid({ items, className = '' }: { items: SpecGridItem[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-2.5 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 rounded-2xl bg-surface p-3.5">
          <dt className="font-body text-[13px] text-text-muted">{item.label}</dt>
          <dd className="min-w-0 break-words font-body text-[17px] font-semibold text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
