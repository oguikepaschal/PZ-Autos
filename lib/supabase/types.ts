// Hand-maintained to match supabase/migrations exactly. If you add/rename a
// column, update both the migration and here.

export type CarStatus = 'draft' | 'available' | 'reserved' | 'sold' | 'withdrawn'
export type SupplierType = 'dealership' | 'individual'

export interface Supplier {
  id: string
  name: string
  supplier_type: SupplierType
  contact_phone: string | null
  contact_email: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Car {
  id: string
  slug: string
  supplier_id: string
  make: string
  model: string
  year: number
  trim: string | null
  body_type: string | null
  transmission: string | null
  fuel_type: string | null
  mileage_km: number | null
  exterior_colour: string | null
  interior_colour: string | null
  engine_layout: string | null
  drivetrain: string | null
  condition: string | null
  description: string | null
  key_features: string[] | null
  location_area: string | null
  vin: string | null
  registration_plate: string | null
  cost_price_ngn: string | null
  asking_price_ngn: string
  status: CarStatus
  status_changed_at: string
  archive_reason: string | null
  last_verified_at: string
  is_featured: boolean
  featured_order: number | null
  acquisition_notes: string | null
  created_at: string
  updated_at: string
}

export interface CarWithSupplier extends Car {
  supplier: Pick<Supplier, 'id' | 'name' | 'supplier_type'>
  // PostgREST relation count: one row holding the number of taps.
  whatsapp_clicks: { count: number }[]
}

export interface CarImage {
  id: string
  car_id: string
  storage_path: string
  alt_text: string | null
  is_cover: boolean
  sort_order: number
  created_at: string
}

export interface Enquiry {
  id: string
  car_id: string | null
  name: string | null
  phone: string | null
  message: string | null
  source: string
  created_at: string
}
