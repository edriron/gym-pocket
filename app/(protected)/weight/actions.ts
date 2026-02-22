'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WeightFormValues } from '@/lib/validations'

export async function addWeightRecord(values: WeightFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('weight_records').insert({
    user_id: user.id,
    recorded_at: values.recorded_at,
    weight_kg: values.weight_kg,
  })

  if (error) return { error: error.message }
  revalidatePath('/weight')
  revalidatePath('/dashboard')
}

export async function updateWeightRecord(id: string, values: WeightFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('weight_records')
    .update({ recorded_at: values.recorded_at, weight_kg: values.weight_kg })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/weight')
  revalidatePath('/dashboard')
}

export async function deleteWeightRecord(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('weight_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/weight')
  revalidatePath('/dashboard')
}
