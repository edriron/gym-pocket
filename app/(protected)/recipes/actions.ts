'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { RecipeFormValues } from '@/lib/validations'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('permission').eq('id', userId).single()
  return (data as any)?.permission === 'admin'
}

type IngredientInput = {
  item_id: string
  item_type: 'product' | 'recipe'
  quantity_g: number
}

export async function addRecipe(values: RecipeFormValues, ingredients: IngredientInput[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      created_by: user.id,
      name: values.name,
      description: values.description || null,
    })
    .select('id')
    .single()

  if (recipeError || !recipe) return { error: recipeError?.message ?? 'Failed to create recipe' }

  if (ingredients.length > 0) {
    const rows = ingredients.map((ing) => ({
      recipe_id: recipe.id,
      product_id: ing.item_type === 'product' ? ing.item_id : null,
      sub_recipe_id: ing.item_type === 'recipe' ? ing.item_id : null,
      quantity_g: ing.quantity_g,
    }))

    const { error: ingError } = await supabase.from('recipe_ingredients').insert(rows)
    if (ingError) return { error: ingError.message }
  }

  revalidatePath('/recipes')
}

export async function updateRecipe(
  id: string,
  values: RecipeFormValues,
  ingredients: IngredientInput[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = await isAdmin(supabase, user.id)
  let updateQuery = supabase
    .from('recipes')
    .update({ name: values.name, description: values.description || null })
    .eq('id', id)
  if (!admin) updateQuery = updateQuery.eq('created_by', user.id)

  const { error: recipeError } = await updateQuery
  if (recipeError) return { error: recipeError.message }

  // Replace all ingredients
  await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)

  if (ingredients.length > 0) {
    const rows = ingredients.map((ing) => ({
      recipe_id: id,
      product_id: ing.item_type === 'product' ? ing.item_id : null,
      sub_recipe_id: ing.item_type === 'recipe' ? ing.item_id : null,
      quantity_g: ing.quantity_g,
    }))

    const { error: ingError } = await supabase.from('recipe_ingredients').insert(rows)
    if (ingError) return { error: ingError.message }
  }

  revalidatePath('/recipes')
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = await isAdmin(supabase, user.id)
  let deleteQuery = supabase.from('recipes').delete().eq('id', id)
  if (!admin) deleteQuery = deleteQuery.eq('created_by', user.id)

  const { error } = await deleteQuery
  if (error) return { error: error.message }
  revalidatePath('/recipes')
}
