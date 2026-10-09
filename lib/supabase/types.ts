// Row types derive from lib/supabase/database.types.ts, which is generated
// from the live schema (regenerate it after any migration). The only manual
// part is narrowing the car status and supplier type, which the app constrains
// to a fixed set.
import type { Tables } from './database.types'

export type CarStatus = 'draft' | 'available' | 'reserved' | 'sold' | 'withdrawn'

export type SupplierType = 'dealership' | 'individual'

export type Supplier = Omit<Tables<'suppliers'>, 'supplier_type'> & {
  supplier_type: SupplierType
}

export type Car = Omit<Tables<'cars'>, 'status'> & { status: CarStatus }

export interface CarWithSupplier extends Car {
  supplier: Pick<Supplier, 'id' | 'name' | 'supplier_type'>
  // PostgREST relation count: one row holding the number of taps.
  card_taps: { count: number }[]
}

export type CarImage = Tables<'car_images'>

export type Enquiry = Tables<'enquiries'>
