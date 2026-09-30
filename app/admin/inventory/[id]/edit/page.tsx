import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CarEditForm } from '@/components/admin/CarEditForm'
import { formatCarTitle } from '@/lib/formatters'
import type { Car, CarImage, Supplier } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCarPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car } = await supabase.from('cars').select('*').eq('id', id).maybeSingle()
  if (!car) notFound()

  const { data: images } = await supabase
    .from('car_images')
    .select('*')
    .eq('car_id', id)
    .order('sort_order', { ascending: true })

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, supplier_type')
    .or(`is_active.eq.true,id.eq.${car.supplier_id}`)
    .order('name')

  const typedCar = car as Car

  return (
    <div>
      <h1 className="mb-6 font-display font-black text-h3 tracking-display text-ink">
        Edit {formatCarTitle(typedCar.make, typedCar.model, typedCar.year)}
      </h1>
      <CarEditForm
        car={typedCar}
        images={(images ?? []) as CarImage[]}
        suppliers={(suppliers ?? []) as Pick<Supplier, 'id' | 'name' | 'supplier_type'>[]}
      />
    </div>
  )
}
