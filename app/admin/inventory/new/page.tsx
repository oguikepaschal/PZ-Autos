import { createClient } from '@/lib/supabase/server'
import { CarForm } from '@/components/admin/CarForm'
import type { Supplier } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function NewCarPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, supplier_type')
    .eq('is_active', true)
    .order('name')

  return <CarForm suppliers={(suppliers ?? []) as Pick<Supplier, 'id' | 'name' | 'supplier_type'>[]} />
}
