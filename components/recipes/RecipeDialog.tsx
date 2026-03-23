"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
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
  // Remembers the last manually-typed qty per ingredient while the dialog is open
  const [customQtys, setCustomQtys] = useState<Record<string, number>>({});
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
      setCustomQtys({});
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

  const productMap = new Map(products.map((p) => [p.id, p]));

  function addIngredient(item: {
    id: string;
    name: string;
    type: "product" | "recipe";
  }) {
    const defaultQty = 100;

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
    // If qty doesn't match any serving option or the 100g baseline, remember it as custom
    const ing = ingredients.find((i) => i.id === id);
    if (ing?.item_type === "product") {
      const product = productMap.get(ing.item_id);
      const opts = product?.serving_options ?? [];
      if (opts.length > 0 && qty !== 100 && !opts.some((o) => o.weight_g === qty)) {
        setCustomQtys((prev) => ({ ...prev, [id]: qty }));
      }
    }
  }

  function applyServingOption(id: string, weightG: number) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity_g: weightG } : i)),
    );
  }

  function applyCustomQty(id: string) {
    const custom = customQtys[id];
    if (custom !== undefined) {
      setIngredients((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity_g: custom } : i)),
      );
    }
  }

  // Live nutrition calculation
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
                      {ingredients.map((ing) => {
                        const product = ing.item_type === "product" ? productMap.get(ing.item_id) : null;
                        const opts = product?.serving_options ?? [];
                        const matchesOpt = opts.some((o) => o.weight_g === ing.quantity_g);
                        const is100g = ing.quantity_g === 100;
                        const isCustomActive = opts.length > 0 && !matchesOpt && !is100g;
                        const hasCustomMemory = customQtys[ing.id] !== undefined && customQtys[ing.id] !== 100;
                        return (
                          <div
                            key={ing.id}
                            className="rounded-lg border bg-muted/30 px-3 py-2 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex-1 truncate text-sm font-medium">
                                {ing.item_name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  title="Double the amount"
                                  onClick={() => updateQty(ing.id, ing.quantity_g * 2)}
                                  className="px-1 py-0.5 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  ×2
                                </button>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  value={ing.quantity_g}
                                  onChange={(e) =>
                                    updateQty(ing.id, parseFloat(e.target.value) || 0)
                                  }
                                  className="h-7 w-20 text-sm text-right"
                                />
                                <span className="text-xs text-muted-foreground">g</span>
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
                            {opts.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {/* Always-present 100g baseline chip */}
                                <button
                                  type="button"
                                  onClick={() => applyServingOption(ing.id, 100)}
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                                    ing.quantity_g === 100
                                      ? "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                                      : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                                  }`}
                                >
                                  100g
                                </button>
                                {opts.map((opt) => {
                                  const active = ing.quantity_g === opt.weight_g;
                                  return (
                                    <button
                                      key={opt.label}
                                      type="button"
                                      onClick={() => applyServingOption(ing.id, opt.weight_g)}
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                                        active
                                          ? "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                                          : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                                      }`}
                                    >
                                      {opt.label} · {opt.weight_g}g
                                    </button>
                                  );
                                })}
                                {(isCustomActive || hasCustomMemory) && (
                                  <button
                                    type="button"
                                    onClick={() => applyCustomQty(ing.id)}
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                                      isCustomActive
                                        ? "bg-muted border-foreground/20 text-foreground"
                                        : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                                    }`}
                                  >
                                    Custom{isCustomActive ? ` · ${ing.quantity_g}g` : ""}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
