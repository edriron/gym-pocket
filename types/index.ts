import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type WeightRecord = Database['public']['Tables']['weight_records']['Row']

export type ServingOption = { label: string; weight_g: number }

// Extend the DB-generated type to include columns added after codegen
export type Product = Database['public']['Tables']['products']['Row'] & {
  serving_options: ServingOption[]
}
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row']
export type DietTable = Database['public']['Tables']['diet_tables']['Row']
export type DietSection = Database['public']['Tables']['diet_sections']['Row']
export type DietRow = Database['public']['Tables']['diet_rows']['Row']
export type WorkoutTable = Database['public']['Tables']['workout_tables']['Row']
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row']
export type TableShare = Database['public']['Tables']['table_shares']['Row']

// Extended types with joined data
export type RecipeIngredientWithDetails = RecipeIngredient & {
  product: Product | null
  sub_recipe: Recipe | null
}

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredientWithDetails[]
}

export type DietRowWithDetails = DietRow & {
  product: Product | null
  recipe: (Recipe & { nutrition?: NutritionValues }) | null
}

export type DietSectionWithRows = DietSection & {
  diet_rows: DietRowWithDetails[]
}

export type DietTableWithSections = DietTable & {
  diet_sections: DietSectionWithRows[]
}

export type WorkoutTableWithExercises = WorkoutTable & {
  workout_exercises: WorkoutExercise[]
}

export type SharedDietTable = DietTable & {
  share: TableShare
}

export type SharedWorkoutTable = WorkoutTable & {
  share: TableShare
}

export type NutritionValues = {
  calories: number
  carbs_g: number
  protein_g: number
  fats_g: number
}

export type FoodLog = {
  id: string
  user_id: string
  product_id: string | null
  recipe_id: string | null
  quantity_g: number
  logged_at: string
  created_at: string
}

export type FoodLogWithDetails = FoodLog & {
  product: Product | null
  recipe: (Recipe & { nutrition?: NutritionValues }) | null
}
