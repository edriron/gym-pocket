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
import { dietTableSchema, type DietTableFormValues } from '@/lib/validations'
import { createDietTable } from '@/app/(protected)/diet/actions'

interface CreateTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDietTableDialog({ open, onOpenChange }: CreateTableDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<DietTableFormValues>({
    resolver: zodResolver(dietTableSchema),
    defaultValues: { name: '' },
  })

  async function handleSubmit(values: DietTableFormValues) {
    setLoading(true)
    try {
      const result = await createDietTable(values)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.id) {
        toast.success('Diet table created')
        onOpenChange(false)
        form.reset()
        router.push(`/diet/${result.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Diet Table</DialogTitle>
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
                    <Input placeholder="e.g. Cutting Plan, Bulk Diet" {...field} />
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

export function CreateDietTableButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> New Diet Table
      </Button>
      <CreateDietTableDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
