'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { workoutTableSchema, type WorkoutTableFormValues } from '@/lib/validations'
import { createWorkoutTable } from '@/app/(protected)/workout/actions'

interface CreateWorkoutTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkoutTableDialog({ open, onOpenChange }: CreateWorkoutTableDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<WorkoutTableFormValues>({
    resolver: zodResolver(workoutTableSchema),
    defaultValues: { name: '' },
  })

  async function handleSubmit(values: WorkoutTableFormValues) {
    setLoading(true)
    try {
      const result = await createWorkoutTable(values)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.id) {
        toast.success('Workout table created')
        onOpenChange(false)
        form.reset()
        router.push(`/workout/${result.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Workout Table</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Push Day, Full Body" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function CreateWorkoutTableButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> New Workout Table
      </Button>
      <CreateWorkoutTableDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
