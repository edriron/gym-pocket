'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Search, ChefHat } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RecipeDialog } from './RecipeDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { updateRecipe, deleteRecipe } from '@/app/(protected)/recipes/actions'
import type { Product, Recipe, RecipeWithIngredients } from '@/types'
import type { RecipeFormValues } from '@/lib/validations'

interface RecipesTableProps {
  recipes: RecipeWithIngredients[]
  allProducts: Product[]
  allRecipes: Recipe[]
  currentUserId: string
}

export function RecipesTable({
  recipes,
  allProducts,
  allRecipes,
  currentUserId,
}: RecipesTableProps) {
  const [editRecipe, setEditRecipe] = useState<RecipeWithIngredients | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleUpdate(
    values: RecipeFormValues,
    ingredients: { item_id: string; item_type: 'product' | 'recipe'; quantity_g: number }[]
  ) {
    if (!editRecipe) return
    const result = await updateRecipe(editRecipe.id, values, ingredients)
    if (result?.error) toast.error(result.error)
    else toast.success('Recipe updated')
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteRecipe(deleteId)
    if (result?.error) toast.error(result.error)
    else toast.success('Recipe deleted')
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Ingredients</TableHead>
              <TableHead className="hidden sm:table-cell">Description</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {search ? 'No recipes match your search.' : 'No recipes yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {recipe.recipe_ingredients.length} items
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {recipe.description ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {recipe.created_by === currentUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => setEditRecipe(recipe)}
                          >
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(recipe.id)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RecipeDialog
        open={!!editRecipe}
        onOpenChange={(o) => !o && setEditRecipe(null)}
        recipe={editRecipe}
        products={allProducts}
        recipes={allRecipes}
        onSubmit={handleUpdate}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete recipe?"
        description="This will permanently delete the recipe and all its ingredients."
        onConfirm={handleDelete}
      />
    </>
  )
}
