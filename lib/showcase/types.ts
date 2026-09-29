import type { Tables } from '@/lib/supabase/database.types'

// Derived from the generated view row types (lib/supabase/database.types.ts).
// Postgres reports every view column as nullable, so the columns that can
// never be null (they come straight from non-null cars columns, or the view's
// own filter guarantees them) are narrowed here, along with status.
type PublicCarRow = Tables<'public_cars_view'>
type NonNullCarKeys =
  | 'id'
  | 'slug'
  | 'make'
  | 'model'
  | 'year'
  | 'asking_price_ngn'
  | 'status_changed_at'
  | 'last_verified_at'
  | 'is_featured'
  | 'created_at'
  | 'updated_at'

export type PublicCar = Omit<PublicCarRow, NonNullCarKeys | 'status'> & {
  [K in NonNullCarKeys]: NonNullable<PublicCarRow[K]>
} & { status: 'available' | 'reserved' | 'sold' }

type PublicCarImageRow = Tables<'public_car_images_view'>
type NonNullImageKeys = 'id' | 'car_id' | 'storage_path' | 'is_cover' | 'sort_order'

export type PublicCarImage = Omit<PublicCarImageRow, NonNullImageKeys> & {
  [K in NonNullImageKeys]: NonNullable<PublicCarImageRow[K]>
}

export interface PublicCarWithImages extends PublicCar {
  images: PublicCarImage[]
}

export interface PublicCarCardData extends PublicCar {
  coverImageUrl: string | null
}
