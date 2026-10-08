'use client'

import { useState } from 'react'
import { AlertCircle, Plus } from 'lucide-react'
import { Row, SelectRow, rowControlClass, rowSelectClass } from './FormRows'
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

  // Rows for the locked "Only you see this" group: the parent renders them
  // straight into its RowGroup, so each one is a direct child of the group.
  if (creating) {
    return (
      <>
        <Row label="New supplier">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={rowControlClass}
          />
        </Row>
        <SelectRow label="Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'dealership' | 'individual')}
            className={rowSelectClass}
          >
            <option value="individual">Individual</option>
            <option value="dealership">Dealership</option>
          </select>
        </SelectRow>
        <Row label="Phone">
          <input
            type="tel"
            inputMode="tel"
            placeholder="Optional"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={rowControlClass}
          />
        </Row>
        <div className="ml-4 flex min-h-[52px] flex-wrap items-center justify-end gap-2 border-t border-hairline py-1.5 pr-2">
          {error && (
            <p role="alert" className="mr-auto flex items-center gap-1.5 font-body text-sm text-ink">
              <AlertCircle size={16} aria-hidden="true" className="shrink-0 text-signal-red" />
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="min-h-11 rounded-full px-4 font-body text-[15px] font-semibold text-ink active:bg-fill"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="min-h-11 rounded-full bg-ink px-4 font-body text-[15px] font-semibold text-ink-inverse disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save supplier'}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <SelectRow label="Supplier">
        <select value={value} onChange={(e) => onChange(e.target.value)} required className={rowSelectClass}>
          <option value="">Select</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.supplier_type})
            </option>
          ))}
          <option value={CUSTOM_SUPPLIER}>Custom name (this car only)…</option>
        </select>
      </SelectRow>
      {value === CUSTOM_SUPPLIER && (
        <Row label="Supplier name">
          <input
            type="text"
            placeholder="For this car only"
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            className={rowControlClass}
          />
        </Row>
      )}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="ml-4 flex min-h-[52px] w-[calc(100%-1rem)] items-center gap-2 border-t border-hairline pr-4 text-left font-body text-base text-ink active:bg-fill"
      >
        <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
        Add a new supplier
      </button>
    </>
  )
}
