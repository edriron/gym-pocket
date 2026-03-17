'use client'

import { useState } from 'react'
import { Trash2, ChefHat } from 'lucide-react'
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
      setQty(row.quantity_g)
    }
    setSaving(false)
  }

  async function handleDelete() {
    const result = await deleteDietRow(row.id, dietTableId)
    if (result?.error) toast.error(result.error)
  }

  return (
    <TableRow className="group hover:bg-muted/40 transition-colors">
      <TableCell className="font-medium py-2.5">
        <div className="flex items-center gap-2 truncate">
          <span className="truncate">{name}</span>
          {row.recipe && (
            <span className="inline-flex items-center gap-0.5 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              <ChefHat className="size-2.5" /> recipe
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2.5">
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
          <span className="text-sm text-muted-foreground">{qty}g</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm py-2.5">
        {nutrition ? (
          <span className="font-semibold text-red-600 dark:text-red-400">{fmtNum(nutrition.calories)}</span>
        ) : '—'}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm py-2.5 hidden sm:table-cell text-muted-foreground">
        {nutrition ? fmtNum(nutrition.carbs_g) : '—'}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm py-2.5 hidden sm:table-cell text-muted-foreground">
        {nutrition ? fmtNum(nutrition.protein_g) : '—'}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm py-2.5 hidden sm:table-cell text-muted-foreground">
        {nutrition ? fmtNum(nutrition.fats_g) : '—'}
      </TableCell>
      {canEdit && (
        <TableCell className="py-2.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="size-3 text-destructive" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}
