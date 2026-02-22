'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WorkoutTableFormValues, WorkoutExerciseFormValues, ShareFormValues } from '@/lib/validations'
import { shareTable as dietShareTable, removeShare as dietRemoveShare } from '../diet/actions'

export async function createWorkoutTable(values: WorkoutTableFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('workout_tables')
    .insert({ user_id: user.id, name: values.name })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/workout')
  return { id: data.id }
}

export async function renameWorkoutTable(id: string, name: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_tables')
    .update({ name })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/workout')
  revalidatePath(`/workout/${id}`)
}

export async function deleteWorkoutTable(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('workout_tables')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/workout')
}

export async function addWorkoutExercise(
  workoutTableId: string,
  values: WorkoutExerciseFormValues,
  sortOrder: number
) {
  const supabase = await createClient()

  const { error } = await supabase.from('workout_exercises').insert({
    workout_table_id: workoutTableId,
    name: values.name,
    sets: values.sets,
    reps: values.reps,
    calories: values.calories ?? null,
    sort_order: sortOrder,
  })

  if (error) return { error: error.message }
  revalidatePath(`/workout/${workoutTableId}`)
}

export async function updateWorkoutExercise(
  id: string,
  workoutTableId: string,
  values: WorkoutExerciseFormValues
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_exercises')
    .update({
      name: values.name,
      sets: values.sets,
      reps: values.reps,
      calories: values.calories ?? null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/workout/${workoutTableId}`)
}

export async function deleteWorkoutExercise(id: string, workoutTableId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('workout_exercises').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/workout/${workoutTableId}`)
}

// Re-export share functions for workout tables
export { dietShareTable as shareWorkoutTable, dietRemoveShare as removeWorkoutShare }
