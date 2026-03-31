'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AddFoodLogInput = {
  product_id?: string
  recipe_id?: string
  quantity_g: number
  logged_at: string // ISO string
}

export async function addFoodLog(input: AddFoodLogInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('food_logs').insert({
    user_id: user.id,
    product_id: input.product_id ?? null,
    recipe_id: input.recipe_id ?? null,
    quantity_g: input.quantity_g,
    logged_at: input.logged_at,
  })

  if (error) return { error: (error as { message: string }).message }
  revalidatePath('/log')
}

export async function deleteFoodLog(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('food_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath('/log')
}
