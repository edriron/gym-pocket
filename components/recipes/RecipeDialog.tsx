"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { IngredientPicker } from "./IngredientPicker";
import { NutritionSummaryBar } from "@/components/shared/NutritionSummaryBar";
import { recipeSchema, type RecipeFormValues } from "@/lib/validations";
import { calcProductNutrition, sumNutrition } from "@/lib/nutrition";
import type {
  Product,
  Recipe,
  RecipeWithIngredients,
  NutritionValues,
} from "@/types";

interface LocalIngredient {
  id: string;
  item_id: string;
  item_name: string;
  item_type: "product" | "recipe";
  quantity_g: number;
}

interface RecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe?: RecipeWithIngredients | null;
  products: Product[];
  recipes: Recipe[];
  onSubmit: (
    values: RecipeFormValues,
    ingredients: {
      item_id: string;
      item_type: "product" | "recipe";
      quantity_g: number;
    }[],
  ) => Promise<void>;
}

export function RecipeDialog({
  open,
  onOpenChange,
  recipe,
  products,
  recipes,
  onSubmit,
}: RecipeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);
  const isEdit = !!recipe;

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: recipe?.name ?? "",
        description: recipe?.description ?? "",
      });
      if (recipe?.recipe_ingredients) {
        setIngredients(
          recipe.recipe_ingredients.map((ri, i) => ({
            id: `existing-${i}`,
            item_id: ri.product_id ?? ri.sub_recipe_id ?? "",
            item_name: ri.product?.name ?? ri.sub_recipe?.name ?? "",
            item_type: ri.product_id ? "product" : "recipe",
            quantity_g: ri.quantity_g,
          })),
        );
      } else {
        setIngredients([]);
      }
    }
  }, [open, recipe, form]);

  function addIngredient(item: {
    id: string;
    name: string;
    type: "product" | "recipe";
  }) {
    const product =
      item.type === "product" ? products.find((p) => p.id === item.id) : null;
    const defaultQty = product?.serving_size_g ?? 100;

    setIngredients((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        item_id: item.id,
        item_name: item.name,
        item_type: item.type,
        quantity_g: defaultQty,
      },
    ]);
  }

  function removeIngredient(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQty(id: string, qty: number) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity_g: qty } : i)),
    );
  }

  // Live nutrition calculation
  const productMap = new Map(products.map((p) => [p.id, p]));
  const nutrition: NutritionValues = sumNutrition(
    ingredients
      .filter((ing) => ing.item_type === "product")
      .map((ing) => {
        const product = productMap.get(ing.item_id);
        if (!product)
          return { calories: 0, carbs_g: 0, protein_g: 0, fats_g: 0 };
        return calcProductNutrition(product, ing.quantity_g);
      }),
  );

  async function handleSubmit(values: RecipeFormValues) {
    if (ingredients.length === 0) {
      form.setError("name", { message: "Add at least one ingredient" });
      return;
    }
    setLoading(true);
    try {
      await onSubmit(
        values,
        ingredients.map((i) => ({
          item_id: i.item_id,
          item_type: i.item_type,
          quantity_g: i.quantity_g,
        })),
      );
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Recipe" : "Create Recipe"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* SCROLLABLE AREA */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Protein Shake, Oatmeal Bowl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">Ingredients</p>
                <IngredientPicker
                  products={products}
                  recipes={recipes}
                  excludeRecipeId={recipe?.id}
                  onSelect={addIngredient}
                />

                {ingredients.length > 0 && (
                  <ScrollArea className="max-h-52">
                    <div className="space-y-2 pr-2">
                      {ingredients.map((ing) => (
                        <div
                          key={ing.id}
                          className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                        >
                          <span className="flex-1 truncate text-sm font-medium">
                            {ing.item_name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={ing.quantity_g}
                              onChange={(e) =>
                                updateQty(
                                  ing.id,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="h-7 w-20 text-sm text-right"
                            />
                            <span className="text-xs text-muted-foreground">
                              g
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeIngredient(ing.id)}
                            >
                              <Trash2 className="size-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            {ingredients.length > 0 && (
              <div className="pt-2 pb-1 border-t">
                <NutritionSummaryBar
                  {...nutrition}
                  label="Total (products only):"
                  variant="section"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Recipe"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
