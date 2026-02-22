'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateWorkoutExercise, deleteWorkoutExercise } from '@/app/(protected)/workout/actions'
import { workoutExerciseSchema, type WorkoutExerciseFormValues } from '@/lib/validations'
import type { WorkoutExercise } from '@/types'

interface WorkoutExerciseRowProps {
  exercise: WorkoutExercise
  workoutTableId: string
  canEdit: boolean
}

export function WorkoutExerciseRow({
  exercise,
  workoutTableId,
  canEdit,
}: WorkoutExerciseRowProps) {
  const [editing, setEditing] = useState(false)

  const form = useForm<WorkoutExerciseFormValues>({
    resolver: zodResolver(workoutExerciseSchema),
    defaultValues: {
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      calories: exercise.calories,
    },
  })

  async function handleSave(values: WorkoutExerciseFormValues) {
    const result = await updateWorkoutExercise(exercise.id, workoutTableId, values)
    if (result?.error) toast.error(result.error)
    else setEditing(false)
  }

  async function handleDelete() {
    const result = await deleteWorkoutExercise(exercise.id, workoutTableId)
    if (result?.error) toast.error(result.error)
  }

  if (editing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            {...form.register('name')}
            className="h-7 text-sm"
            placeholder="Exercise name"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            {...form.register('sets', { valueAsNumber: true })}
            className="h-7 w-16 text-sm text-center"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            {...form.register('reps', { valueAsNumber: true })}
            className="h-7 w-16 text-sm text-center"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            step="0.1"
            {...form.register('calories', { valueAsNumber: true })}
            className="h-7 w-20 text-sm text-center"
            placeholder="—"
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={form.handleSubmit(handleSave)}
            >
              <Check className="size-3 text-green-600" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              <X className="size-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{exercise.name}</TableCell>
      <TableCell className="text-center tabular-nums">{exercise.sets}</TableCell>
      <TableCell className="text-center tabular-nums">{exercise.reps}</TableCell>
      <TableCell className="text-center tabular-nums">
        {exercise.calories != null ? `${exercise.calories} kcal` : '—'}
      </TableCell>
      {canEdit && (
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleDelete}
            >
              <Trash2 className="size-3 text-destructive" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
