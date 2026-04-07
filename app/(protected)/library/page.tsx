import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductsTable } from '@/components/products/ProductsTable'
import { RecipesTable } from '@/components/recipes/RecipesTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { BookOpen, ShoppingBasket, ChefHat } from 'lucide-react'
import { AddProductButton } from '@/app/(protected)/products/AddProductButton'
import { ImportProductsButton } from '@/app/(protected)/products/ImportProductsButton'
import { AddRecipeButton } from '@/app/(protected)/recipes/AddRecipeButton'
import { LibraryTabs } from './LibraryTabs'

export const metadata = { title: 'Library — Gym Pocket' }

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const defaultTab = tab === 'recipes' ? 'recipes' : 'products'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: products }, recipesRes, { data: profile }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients!recipe_ingredients_recipe_id_fkey (
          *,
          product:products(*),
          sub_recipe:recipes!recipe_ingredients_sub_recipe_id_fkey(id,name)
        )
      `)
      .order('name'),
    supabase.from('profiles').select('permission').eq('id', user!.id).single(),
  ])

  const productList = products ?? []
  const recipeList = recipesRes.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (profile as any)?.permission === 'admin'
  const simpleRecipes = recipeList.map(({ recipe_ingredients: _, ...r }) => r)

  const productsContent = (
    <>
      {productList.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          iconColor="amber"
          title="No products yet"
          description="Be the first to add a product with nutritional info."
          action={<AddProductButton />}
        />
      ) : (
        <ProductsTable products={productList} currentUserId={user!.id} isAdmin={isAdmin} />
      )}
    </>
  )

  const recipesContent = (
    <>
      {recipeList.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          iconColor="pink"
          title="No recipes yet"
          description="Create your first recipe by combining products."
          action={<AddRecipeButton products={productList} recipes={simpleRecipes} />}
        />
      ) : (
        <RecipesTable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recipes={recipeList as any}
          allProducts={productList}
          allRecipes={simpleRecipes}
          currentUserId={user!.id}
          isAdmin={isAdmin}
        />
      )}
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Manage products and recipes used across your diet plans."
        icon={BookOpen}
        iconColor="amber"
      />

      <LibraryTabs
        defaultTab={defaultTab}
        productsContent={productsContent}
        recipesContent={recipesContent}
        productCount={productList.length}
        recipeCount={recipeList.length}
        productActions={
          <div className="flex gap-2">
            <ImportProductsButton />
            <AddProductButton />
          </div>
        }
        recipeActions={
          <AddRecipeButton products={productList} recipes={simpleRecipes} />
        }
      />
    </div>
  )
}
