'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProductDialog } from '@/components/products/ProductDialog'
import { addProduct } from './actions'
import type { ProductFormValues } from '@/lib/validations'

export function AddProductButton() {
  const [open, setOpen] = useState(false)

  async function handleSubmit(values: ProductFormValues) {
    const result = await addProduct(values)
    if (result?.error) { toast.error(result.error); return { error: result.error } }
    toast.success('Product added')
    return { productId: (result as any).productId as string }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Add Product
      </Button>
      <ProductDialog open={open} onOpenChange={setOpen} onSubmit={handleSubmit} />
    </>
  )
}
