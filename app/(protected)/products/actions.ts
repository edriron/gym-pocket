'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProductFormValues } from '@/lib/validations'

export async function addProduct(values: ProductFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('products').insert({
    created_by: user.id,
    name: values.name,
    description: values.description || null,
    calories: values.calories,
    carbs_g: values.carbs_g,
    protein_g: values.protein_g,
    fats_g: values.fats_g,
    serving_size_g: values.serving_size_g ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/products')
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('products')
    .update({
      name: values.name,
      description: values.description || null,
      calories: values.calories,
      carbs_g: values.carbs_g,
      protein_g: values.protein_g,
      fats_g: values.fats_g,
      serving_size_g: values.serving_size_g ?? null,
    })
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) return { error: error.message }
  revalidatePath('/products')
  revalidatePath('/recipes')
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) return { error: error.message }
  revalidatePath('/products')
}
