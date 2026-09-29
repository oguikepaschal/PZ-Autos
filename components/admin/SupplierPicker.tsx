'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizeNigerianPhone } from '@/lib/formatters'
import type { Supplier } from '@/lib/supabase/types'

interface SupplierPickerProps {
  suppliers: Pick<Supplier, 'id' | 'name' | 'supplier_type'>[]
  value: string
  onChange: (supplierId: string) => void
  onSupplierCreated: (supplier: Pick<Supplier, 'id' | 'name' | 'supplier_type'>) => void
  customName: string
  onCustomNameChange: (name: string) => void
}

// Select value meaning "a name for this car only". It is never a real id.
export const CUSTOM_SUPPLIER = '__custom__'

// A one-off supplier still needs a row (cars.supplier_id is required), but it
// is created inactive so no supplier dropdown ever lists it for another car.
export async function createOneOffSupplier(name: string): Promise<string> {
  const { data, error } = await createClient()
    .from('suppliers')
    .insert({ name: name.trim(), supplier_type: 'individual', is_active: false })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Could not create supplier')
  return data.id
}

// A one-off individual seller doesn't deserve the friction of a separate
// "manage suppliers" screen, so creation is inline here — but it still goes
// through the real suppliers table (never a free-text field on cars), which
// is what keeps supplier identity structurally excludable from every public
// view (see the schema migration's note on why this is a separate table).
export function SupplierPicker({
  suppliers,
  value,
  onChange,
  onSupplierCreated,
  customName,
  onCustomNameChange,
}: SupplierPickerProps) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'dealership' | 'individual'>('individual')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    if (!name.trim()) {
      setError('Supplier name is required')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('suppliers')
      .insert({
        name: name.trim(),
        supplier_type: type,
        contact_phone: phone ? normalizeNigerianPhone(phone) : null,
      })
      .select('id, name, supplier_type')
      .single()

    setSubmitting(false)

    if (insertError || !data) {
      setError('Could not create supplier')
      return
    }

    onSupplierCreated(data as Pick<Supplier, 'id' | 'name' | 'supplier_type'>)
    onChange(data.id)
    setCreating(false)
    setName('')
    setPhone('')
  }

  if (creating) {
    return (
      <div className="border border-hairline rounded-lg p-3 space-y-2">
        <input
          type="text"
          placeholder="Supplier name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-sm"
        />
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'dealership' | 'individual')}
            className="border border-hairline rounded-lg px-3 py-2 font-body text-sm"
          >
            <option value="individual">Individual</option>
            <option value="dealership">Dealership</option>
          </select>
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 border border-hairline rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>
        {error && <p className="font-body text-xs text-signal-red">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-lg bg-ink text-white font-body text-xs font-semibold px-3 py-1.5"
          >
            {submitting ? 'Saving…' : 'Save supplier'}
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="font-body text-xs text-text-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="flex-1 border border-hairline rounded-lg px-3 py-2 font-body text-sm text-ink"
        >
          <option value="">Select a supplier…</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.supplier_type})
            </option>
          ))}
          <option value={CUSTOM_SUPPLIER}>Custom name (this car only)…</option>
        </select>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg border border-hairline font-body text-sm px-3 py-2 text-ink"
        >
          + New
        </button>
      </div>
      {value === CUSTOM_SUPPLIER && (
        <input
          type="text"
          placeholder="Supplier name for this car"
          value={customName}
          onChange={(e) => onCustomNameChange(e.target.value)}
          className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-sm"
        />
      )}
    </div>
  )
}
