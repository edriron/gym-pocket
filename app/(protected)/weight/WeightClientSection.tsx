'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { WeightDialog } from '@/components/weight/WeightDialog'
import { addWeightRecord } from './actions'
import type { WeightFormValues } from '@/lib/validations'

export function AddWeightButton() {
  const [open, setOpen] = useState(false)

  async function handleSubmit(values: WeightFormValues) {
    const result = await addWeightRecord(values)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Weight record added')
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Add Record
      </Button>
      <WeightDialog open={open} onOpenChange={setOpen} onSubmit={handleSubmit} />
    </>
  )
}
