export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-body text-small font-semibold text-ink mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}
