import { z } from 'zod'

// Note: form inputs call field.onChange(parseFloat(e.target.value)) so values are
// already numbers by the time Zod validates them — no preprocess/coerce needed.

export const weightSchema = z.object({
  recorded_at: z.string().min(1, 'Date is required'),
  weight_kg: z
    .number({ message: 'Weight must be a number' })
    .positive('Weight must be positive')
    .max(999, 'Weight seems too high'),
})
export type WeightFormValues = z.infer<typeof weightSchema>

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  calories: z.number().min(0).max(99999),
  carbs_g: z.number().min(0).max(9999),
  protein_g: z.number().min(0).max(9999),
  fats_g: z.number().min(0).max(9999),
  serving_size_g: z.number().positive().max(99999).optional().nullable(),
})
export type ProductFormValues = z.infer<typeof productSchema>

export const recipeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
})
export type RecipeFormValues = z.infer<typeof recipeSchema>

export const dietTableSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})
export type DietTableFormValues = z.infer<typeof dietTableSchema>

export const dietSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required').max(100),
})
export type DietSectionFormValues = z.infer<typeof dietSectionSchema>

export const dietRowSchema = z.object({
  item_id: z.string().min(1, 'Please select a product or recipe'),
  item_type: z.enum(['product', 'recipe']),
  quantity_g: z.number().positive().max(99999),
})
export type DietRowFormValues = z.infer<typeof dietRowSchema>

export const workoutTableSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})
export type WorkoutTableFormValues = z.infer<typeof workoutTableSchema>

export const workoutExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100),
  sets: z.number().int().positive().max(999),
  reps: z.number().int().positive().max(9999),
  calories: z.number().min(0).max(99999).optional().nullable(),
})
export type WorkoutExerciseFormValues = z.infer<typeof workoutExerciseSchema>

export const shareSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  access_mode: z.enum(['view', 'edit']),
})
export type ShareFormValues = z.infer<typeof shareSchema>
