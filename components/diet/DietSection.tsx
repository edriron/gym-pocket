'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NutritionSummaryBar } from '@/components/shared/NutritionSummaryBar'
import { DietRowItem } from './DietRowItem'
import { IngredientPicker } from '@/components/recipes/IngredientPicker'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  addDietRow,
  deleteDietSection,
  renameDietSection,
} from '@/app/(protected)/diet/actions'
import { calcProductNutrition, sumNutrition } from '@/lib/nutrition'
import type { DietSectionWithRows, Product, Recipe, NutritionValues } from '@/types'

interface DietSectionProps {
  section: DietSectionWithRows
  dietTableId: string
  canEdit: boolean
  products: Product[]
  recipes: Recipe[]
}

export function DietSection({
  section,
  dietTableId,
  canEdit,
  products,
  recipes,
}: DietSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [sectionName, setSectionName] = useState(section.name)
  const [showPicker, setShowPicker] = useState(false)

  const productMap = new Map(products.map((p) => [p.id, p]))

  // Calculate section nutrition
  const rowNutritions: NutritionValues[] = section.diet_rows.map((row) => {
    if (row.product) {
      return calcProductNutrition(row.product, row.quantity_g)
    }
    // For recipes, we can't easily calculate client-side without all recipe ingredients loaded
    // Show 0 for now (server-side would provide the actual values)
    return { calories: 0, carbs_g: 0, protein_g: 0, fats_g: 0 }
  })
  const sectionNutrition = sumNutrition(rowNutritions)

  async function handleAddRow(item: { id: string; name: string; type: 'product' | 'recipe' }) {
    const product = item.type === 'product' ? productMap.get(item.id) : null
    const defaultQty = product?.serving_size_g ?? 100

    const result = await addDietRow(
      section.id,
      dietTableId,
      item.id,
      item.type,
      defaultQty,
      section.diet_rows.length
    )
    if (result?.error) toast.error(result.error)
    setShowPicker(false)
  }

  async function handleDeleteSection() {
    const result = await deleteDietSection(section.id, dietTableId)
    if (result?.error) toast.error(result.error)
  }

  async function handleRename() {
    if (sectionName === section.name) {
      setEditingName(false)
      return
    }
    const result = await renameDietSection(section.id, sectionName, dietTableId)
    if (result?.error) toast.error(result.error)
    setEditingName(false)
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between gap-2 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {editingName && canEdit ? (
            <Input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
              className="h-7 text-sm font-semibold w-48"
            />
          ) : (
            <button
              className="font-semibold text-sm hover:underline text-left"
              onClick={() => canEdit && setEditingName(true)}
            >
              {sectionName}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPicker((v) => !v)}
                title="Add item"
              >
                <Plus className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditingName(true)}
                title="Rename section"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDeleteOpen(true)}
                title="Delete section"
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Ingredient picker */}
      {showPicker && canEdit && (
        <div className="px-4 py-2 border-b bg-background">
          <IngredientPicker
            products={products}
            recipes={recipes}
            onSelect={handleAddRow}
          />
        </div>
      )}

      {/* Rows table */}
      {expanded && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">kcal</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Carbs</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Protein</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Fats</TableHead>
                {canEdit && <TableHead className="w-8" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {section.diet_rows.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={canEdit ? 7 : 6}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    {canEdit
                      ? 'No items yet. Click + to add products or recipes.'
                      : 'No items in this section.'}
                  </td>
                </TableRow>
              ) : (
                section.diet_rows.map((row) => (
                  <DietRowItem
                    key={row.id}
                    row={row}
                    dietTableId={dietTableId}
                    canEdit={canEdit}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {/* Section totals */}
          {section.diet_rows.length > 0 && (
            <div className="px-4 py-2 bg-muted/20">
              <NutritionSummaryBar
                {...sectionNutrition}
                label={`${sectionName} total:`}
                variant="section"
              />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${sectionName}"?`}
        description="All rows in this section will be deleted."
        onConfirm={handleDeleteSection}
      />
    </div>
  )
}
