'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { DietTableFormValues, DietSectionFormValues, ShareFormValues } from '@/lib/validations'

export async function createDietTable(values: DietTableFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('diet_tables')
    .insert({ user_id: user.id, name: values.name })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/diet')
  return { id: data.id }
}

export async function renameDietTable(id: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('diet_tables')
    .update({ name })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/diet')
  revalidatePath(`/diet/${id}`)
}

export async function deleteDietTable(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('diet_tables')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/diet')
}

export async function addDietSection(dietTableId: string, values: DietSectionFormValues, sortOrder: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('diet_sections')
    .insert({ diet_table_id: dietTableId, name: values.name, sort_order: sortOrder })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/diet/${dietTableId}`)
  return { id: data.id }
}

export async function renameDietSection(id: string, name: string, dietTableId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('diet_sections')
    .update({ name })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/diet/${dietTableId}`)
}

export async function deleteDietSection(id: string, dietTableId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('diet_sections').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/diet/${dietTableId}`)
}

export async function addDietRow(
  sectionId: string,
  dietTableId: string,
  itemId: string,
  itemType: 'product' | 'recipe',
  quantityG: number,
  sortOrder: number
) {
  const supabase = await createClient()

  const { error } = await supabase.from('diet_rows').insert({
    section_id: sectionId,
    product_id: itemType === 'product' ? itemId : null,
    recipe_id: itemType === 'recipe' ? itemId : null,
    quantity_g: quantityG,
    sort_order: sortOrder,
  })

  if (error) return { error: error.message }
  revalidatePath(`/diet/${dietTableId}`)
}

export async function updateDietRowQty(id: string, quantityG: number, dietTableId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('diet_rows')
    .update({ quantity_g: quantityG })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/diet/${dietTableId}`)
}

export async function deleteDietRow(id: string, dietTableId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('diet_rows').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/diet/${dietTableId}`)
}

export async function shareTable(
  tableId: string,
  tableType: 'diet' | 'workout',
  values: ShareFormValues
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Look up the target user by email
  const { data: targetUser } = await supabase
    .rpc('get_user_id_by_email', { p_email: values.email })

  if (!targetUser) return { error: 'No user found with that email address' }
  if (targetUser === user.id) return { error: 'You cannot share with yourself' }

  const { data: share, error } = await supabase
    .from('table_shares')
    .insert({
      table_type: tableType,
      table_id: tableId,
      owner_id: user.id,
      shared_with_id: targetUser,
      access_mode: values.access_mode,
    })
    .select('*, profile:profiles!table_shares_shared_with_profile_fkey(email, full_name)')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Already shared with this user' }
    return { error: error.message }
  }

  revalidatePath('/diet')
  revalidatePath('/workout')
  return { share }
}

export async function removeShare(shareId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('table_shares')
    .delete()
    .eq('id', shareId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/diet')
  revalidatePath('/workout')
}
