'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import { updateDietRowQty, deleteDietRow } from '@/app/(protected)/diet/actions'
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

  // Calculate nutrition for this row.
  // Recipe nutrition is stored per 100g (pre-computed in page server component),
  // so the same scaling logic applies for both products and recipes.
  const per100g = row.product
    ? { calories: row.product.calories, carbs_g: row.product.carbs_g, protein_g: row.product.protein_g, fats_g: row.product.fats_g }
    : row.recipe?.nutrition ?? null
  const nutrition = per100g
    ? {
        calories: Math.round(per100g.calories * qty / 100 * 10) / 10,
        carbs_g: Math.round(per100g.carbs_g * qty / 100 * 10) / 10,
        protein_g: Math.round(per100g.protein_g * qty / 100 * 10) / 10,
        fats_g: Math.round(per100g.fats_g * qty / 100 * 10) / 10,
      }
    : null

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
        <div className="truncate">
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
