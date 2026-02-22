import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { RecipesTable } from '@/components/recipes/RecipesTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { ChefHat } from 'lucide-react'
import { AddRecipeButton } from './AddRecipeButton'

export const metadata = { title: 'Recipes — Gym Pocket' }

export default async function RecipesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: recipes }, { data: products }] = await Promise.all([
    supabase
      .from('recipes')
      .select('*, recipe_ingredients(*, product:products(*), sub_recipe:recipes(id,name))')
      .order('name'),
    supabase.from('products').select('*').order('name'),
  ])

  const recipeList = recipes ?? []
  const productList = products ?? []
  const simpleRecipes = recipeList.map(({ recipe_ingredients: _, ...r }) => r)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recipes"
        description="Global recipe library combining products and other recipes."
        action={<AddRecipeButton products={productList} recipes={simpleRecipes} />}
      />

      {recipeList.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="No recipes yet"
          description="Create your first recipe by combining products."
          action={<AddRecipeButton products={productList} recipes={simpleRecipes} />}
        />
      ) : (
        <RecipesTable
          recipes={recipeList as any}
          allProducts={productList}
          allRecipes={simpleRecipes}
          currentUserId={user!.id}
        />
      )}
    </div>
  )
}
