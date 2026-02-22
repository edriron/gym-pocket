'use client'

import { useState } from 'react'
import { Plus, Share2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NutritionSummaryBar } from '@/components/shared/NutritionSummaryBar'
import { DietSection } from './DietSection'
import { ShareTableDialog } from './ShareTableDialog'
import { addDietSection, renameDietTable } from '@/app/(protected)/diet/actions'
import { sumNutrition, calcProductNutrition } from '@/lib/nutrition'
import { MEAL_SECTION_PRESETS } from '@/lib/constants'
import type { DietTableWithSections, Product, Recipe, TableShare } from '@/types'

interface DietTableEditorProps {
  table: DietTableWithSections
  products: Product[]
  recipes: Recipe[]
  canEdit: boolean
  isOwner: boolean
  shares: (TableShare & { profile: { email: string; full_name: string | null } })[]
}

export function DietTableEditor({
  table,
  products,
  recipes,
  canEdit,
  isOwner,
  shares,
}: DietTableEditorProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [tableName, setTableName] = useState(table.name)
  const [editingName, setEditingName] = useState(false)

  // Grand-total nutrition across all sections
  const allRows = table.diet_sections.flatMap((s) => s.diet_rows)
  const grandTotal = sumNutrition(
    allRows.map((row) =>
      row.product
        ? calcProductNutrition(row.product, row.quantity_g)
        : { calories: 0, carbs_g: 0, protein_g: 0, fats_g: 0 }
    )
  )

  async function handleAddSection(name: string) {
    const result = await addDietSection(
      table.id,
      { name },
      table.diet_sections.length
    )
    if (result?.error) toast.error(result.error)
    else toast.success(`Section "${name}" added`)
  }

  async function handleRenameTable() {
    if (tableName === table.name) {
      setEditingName(false)
      return
    }
    const result = await renameDietTable(table.id, tableName)
    if (result?.error) toast.error(result.error)
    setEditingName(false)
  }

  return (
    <div className="space-y-5">
      {/* Table header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          {editingName && canEdit ? (
            <Input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              onBlur={handleRenameTable}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameTable()}
              autoFocus
              className="text-2xl font-bold h-10 max-w-xs"
            />
          ) : (
            <h1
              className={`text-2xl font-bold truncate ${canEdit ? 'cursor-pointer hover:underline' : ''}`}
              onClick={() => canEdit && setEditingName(true)}
              title={canEdit ? 'Click to rename' : undefined}
            >
              {tableName}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4" /> Share
            </Button>
          )}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Add Section
                  <ChevronDown className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {MEAL_SECTION_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset}
                    onClick={() => handleAddSection(preset)}
                  >
                    {preset}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Sections */}
      {table.diet_sections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {canEdit
              ? 'Add a section to start planning your meals (e.g. Breakfast, Lunch).'
              : 'No sections added yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {table.diet_sections
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((section) => (
              <DietSection
                key={section.id}
                section={section}
                dietTableId={table.id}
                canEdit={canEdit}
                products={products}
                recipes={recipes}
              />
            ))}
        </div>
      )}

      {/* Grand total */}
      {allRows.length > 0 && (
        <NutritionSummaryBar
          {...grandTotal}
          label="Daily Total:"
          variant="total"
          className="mt-4"
        />
      )}

      {isOwner && (
        <ShareTableDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          tableId={table.id}
          tableType="diet"
          existingShares={shares}
          actionPath={`/diet/${table.id}`}
        />
      )}
    </div>
  )
}
