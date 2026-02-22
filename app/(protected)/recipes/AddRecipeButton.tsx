'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RecipeDialog } from '@/components/recipes/RecipeDialog'
import { addRecipe } from './actions'
import type { RecipeFormValues } from '@/lib/validations'
import type { Product, Recipe } from '@/types'

interface AddRecipeButtonProps {
  products: Product[]
  recipes: Recipe[]
}

export function AddRecipeButton({ products, recipes }: AddRecipeButtonProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(
    values: RecipeFormValues,
    ingredients: { item_id: string; item_type: 'product' | 'recipe'; quantity_g: number }[]
  ) {
    const result = await addRecipe(values, ingredients)
    if (result?.error) toast.error(result.error)
    else toast.success('Recipe created')
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Create Recipe
      </Button>
      <RecipeDialog
        open={open}
        onOpenChange={setOpen}
        products={products}
        recipes={recipes}
        onSubmit={handleSubmit}
      />
    </>
  )
}
