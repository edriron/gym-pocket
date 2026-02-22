import type { NutritionValues, Product, RecipeIngredientWithDetails } from '@/types'

/**
 * Calculate nutrition for a given quantity (in grams) of a product.
 * Product nutrition values are per 100g.
 */
export function calcProductNutrition(
  product: Product,
  quantity_g: number
): NutritionValues {
  const factor = quantity_g / 100
  return {
    calories: Math.round((product.calories * factor) * 10) / 10,
    carbs_g: Math.round((product.carbs_g * factor) * 10) / 10,
    protein_g: Math.round((product.protein_g * factor) * 10) / 10,
    fats_g: Math.round((product.fats_g * factor) * 10) / 10,
  }
}

/**
 * Calculate the total nutrition for a recipe from its ingredients.
 * Handles nested recipes recursively up to depth 10.
 * Returns per-100g nutrition (or total if total_only is true).
 */
export function calcRecipeNutrition(
  ingredients: RecipeIngredientWithDetails[],
  allProducts: Map<string, Product>,
  allRecipeIngredients: Map<string, RecipeIngredientWithDetails[]>,
  depth = 0
): NutritionValues & { total_weight_g: number } {
  if (depth > 10) return { calories: 0, carbs_g: 0, protein_g: 0, fats_g: 0, total_weight_g: 0 }

  let totals: NutritionValues & { total_weight_g: number } = {
    calories: 0,
    carbs_g: 0,
    protein_g: 0,
    fats_g: 0,
    total_weight_g: 0,
  }

  for (const ing of ingredients) {
    if (ing.product_id && ing.product) {
      const n = calcProductNutrition(ing.product, ing.quantity_g)
      totals.calories += n.calories
      totals.carbs_g += n.carbs_g
      totals.protein_g += n.protein_g
      totals.fats_g += n.fats_g
      totals.total_weight_g += ing.quantity_g
    } else if (ing.sub_recipe_id) {
      const subIngredients = allRecipeIngredients.get(ing.sub_recipe_id) ?? []
      const subNutrition = calcRecipeNutrition(subIngredients, allProducts, allRecipeIngredients, depth + 1)
      // Scale sub-recipe nutrition by quantity_g / sub_recipe total weight
      if (subNutrition.total_weight_g > 0) {
        const scaleFactor = ing.quantity_g / subNutrition.total_weight_g
        totals.calories += subNutrition.calories * scaleFactor
        totals.carbs_g += subNutrition.carbs_g * scaleFactor
        totals.protein_g += subNutrition.protein_g * scaleFactor
        totals.fats_g += subNutrition.fats_g * scaleFactor
      }
      totals.total_weight_g += ing.quantity_g
    }
  }

  return {
    calories: Math.round(totals.calories * 10) / 10,
    carbs_g: Math.round(totals.carbs_g * 10) / 10,
    protein_g: Math.round(totals.protein_g * 10) / 10,
    fats_g: Math.round(totals.fats_g * 10) / 10,
    total_weight_g: Math.round(totals.total_weight_g * 10) / 10,
  }
}

/**
 * Sum multiple NutritionValues objects.
 */
export function sumNutrition(items: NutritionValues[]): NutritionValues {
  return items.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      carbs_g: acc.carbs_g + n.carbs_g,
      protein_g: acc.protein_g + n.protein_g,
      fats_g: acc.fats_g + n.fats_g,
    }),
    { calories: 0, carbs_g: 0, protein_g: 0, fats_g: 0 }
  )
}

/**
 * Format a nutrition number for display (1 decimal place).
 */
export function fmtNum(n: number): string {
  return n.toFixed(1)
}
