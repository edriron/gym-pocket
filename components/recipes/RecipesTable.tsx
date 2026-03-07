"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RecipeDialog } from "./RecipeDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { updateRecipe, deleteRecipe } from "@/app/(protected)/recipes/actions";
import type { Product, Recipe, RecipeWithIngredients } from "@/types";
import type { RecipeFormValues } from "@/lib/validations";
import { calcProductNutrition, sumNutrition } from "@/lib/nutrition";

interface RecipesTableProps {
  recipes: RecipeWithIngredients[];
  allProducts: Product[];
  allRecipes: Recipe[];
  currentUserId: string;
}

export function RecipesTable({
  recipes,
  allProducts,
  allRecipes,
  currentUserId,
}: RecipesTableProps) {
  const [editRecipe, setEditRecipe] = useState<RecipeWithIngredients | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const productMap = new Map(allProducts.map((p) => [p.id, p]));

  function getRecipeNutrition(recipe: RecipeWithIngredients) {
    const parts = recipe.recipe_ingredients
      .filter((ing) => ing.product_id)
      .map((ing) => {
        const product = productMap.get(ing.product_id!);
        if (!product)
          return { calories: 0, carbs_g: 0, protein_g: 0, fats_g: 0 };

        return calcProductNutrition(product, ing.quantity_g);
      });

    return sumNutrition(parts);
  }

  async function handleUpdate(
    values: RecipeFormValues,
    ingredients: {
      item_id: string;
      item_type: "product" | "recipe";
      quantity_g: number;
    }[],
  ) {
    if (!editRecipe) return;

    const result = await updateRecipe(editRecipe.id, values, ingredients);

    if (result?.error) toast.error(result.error);
    else toast.success("Recipe updated");
  }

  async function handleDelete() {
    if (!deleteId) return;

    const result = await deleteRecipe(deleteId);

    if (result?.error) toast.error(result.error);
    else toast.success("Recipe deleted");
  }

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Name</TableHead>
              <TableHead className="w-[110px]">Ingredients</TableHead>

              <TableHead className="w-[90px] text-right">kcal</TableHead>
              <TableHead className="w-[90px] text-right">Carbs</TableHead>
              <TableHead className="w-[90px] text-right">Protein</TableHead>
              <TableHead className="w-[90px] text-right">Fats</TableHead>

              <TableHead className="hidden sm:table-cell pl-12">
                Description
              </TableHead>

              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  {search ? "No recipes match your search." : "No recipes yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((recipe) => {
                const nutrition = getRecipeNutrition(recipe);

                return (
                  <TableRow key={recipe.id}>
                    <TableCell className="w-[220px] font-medium">
                      {recipe.name}
                    </TableCell>

                    <TableCell className="w-[110px]">
                      <Badge variant="secondary">
                        {recipe.recipe_ingredients.length} items
                      </Badge>
                    </TableCell>

                    <TableCell className="w-[90px] text-right tabular-nums">
                      {Math.round(nutrition.calories)}
                    </TableCell>

                    <TableCell className="w-[90px] text-right tabular-nums">
                      {nutrition.carbs_g.toFixed(1)}g
                    </TableCell>

                    <TableCell className="w-[90px] text-right tabular-nums">
                      {nutrition.protein_g.toFixed(1)}g
                    </TableCell>

                    <TableCell className="w-[90px] text-right tabular-nums">
                      {nutrition.fats_g.toFixed(1)}g
                    </TableCell>

                    <TableCell className="hidden sm:table-cell pl-12">
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {recipe.description ?? "—"}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <RecipeDialog
        open={!!editRecipe}
        onOpenChange={(o) => !o && setEditRecipe(null)}
        recipe={editRecipe}
        products={allProducts}
        recipes={allRecipes}
        onSubmit={handleUpdate}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete recipe?"
        description="This will permanently delete the recipe and all its ingredients."
        onConfirm={handleDelete}
      />
    </>
  );
}
