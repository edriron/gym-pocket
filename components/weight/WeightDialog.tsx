'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
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
import { weightSchema, type WeightFormValues } from '@/lib/validations'
import type { WeightRecord } from '@/types'

interface WeightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: WeightRecord | null
  onSubmit: (values: WeightFormValues) => Promise<void>
}

export function WeightDialog({ open, onOpenChange, record, onSubmit }: WeightDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!record

  const form = useForm<WeightFormValues>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      recorded_at: format(new Date(), 'yyyy-MM-dd'),
      weight_kg: undefined,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        recorded_at: record?.recorded_at ?? format(new Date(), 'yyyy-MM-dd'),
        weight_kg: record?.weight_kg ?? undefined,
      })
    }
  }, [open, record, form])

  async function handleSubmit(values: WeightFormValues) {
    setLoading(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Weight Record' : 'Add Weight Record'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recorded_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 75.5"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
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
                {isEdit ? 'Save Changes' : 'Add Record'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
