'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import { updateDietRowQty, deleteDietRow } from '@/app/(protected)/diet/actions'
import { calcProductNutrition } from '@/lib/nutrition'
import { fmtNum } from '@/lib/nutrition'
import type { DietRowWithDetails } from '@/types'

interface DietRowItemProps {
  row: DietRowWithDetails
  dietTableId: string
  canEdit: boolean
}

export function DietRowItem({ row, dietTableId, canEdit }: DietRowItemProps) {
  const [qty, setQty] = useState(row.quantity_g)
  const [saving, setSaving] = useState(false)
  const name = row.product?.name ?? row.recipe?.name ?? 'Unknown'

  // Calculate nutrition for this row
  const nutrition = row.product
    ? calcProductNutrition(row.product, qty)
    : null // recipe nutrition would need to be passed from parent

  async function handleQtyBlur() {
    if (qty === row.quantity_g) return
    setSaving(true)
    const result = await updateDietRowQty(row.id, qty, dietTableId)
    if (result?.error) {
      toast.error(result.error)
      setQty(row.quantity_g) // revert
    }
    setSaving(false)
  }

  async function handleDelete() {
    const result = await deleteDietRow(row.id, dietTableId)
    if (result?.error) toast.error(result.error)
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div>
          {name}
          {row.recipe && (
            <span className="ml-1 text-xs text-muted-foreground">(recipe)</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {canEdit ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={qty}
              onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
              onBlur={handleQtyBlur}
              className="h-7 w-20 text-sm text-right"
              disabled={saving}
            />
            <span className="text-xs text-muted-foreground">g</span>
          </div>
        ) : (
          <span className="text-sm">{qty}g</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm">
        {nutrition ? fmtNum(nutrition.calories) : '—'}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
        {nutrition ? fmtNum(nutrition.carbs_g) : '—'}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
        {nutrition ? fmtNum(nutrition.protein_g) : '—'}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
        {nutrition ? fmtNum(nutrition.fats_g) : '—'}
      </TableCell>
      {canEdit && (
        <TableCell>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
          >
            <Trash2 className="size-3 text-destructive" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}
