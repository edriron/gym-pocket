'use client'

import { useState } from 'react'
import { Plus, Share2, ChevronDown, Utensils } from 'lucide-react'
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
import { sumNutrition } from '@/lib/nutrition'
import { MEAL_SECTION_PRESETS } from '@/lib/constants'
import type { DietTableWithSections, Product, Recipe, TableShare } from '@/types'

const PRESET_EMOJIS: Record<string, string> = {
  'Breakfast':       '🌅',
  'Morning Snack':   '🥗',
  'Lunch':           '☀️',
  'Afternoon Snack': '🍎',
  'Dinner':          '🌙',
  'Evening Snack':   '🫖',
  'Pre-Workout':     '⚡',
  'Post-Workout':    '💪',
}

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

  const allRows = table.diet_sections.flatMap((s) => s.diet_rows)
  const grandTotal = sumNutrition(
    allRows.map((row) => {
      const per100g = row.product
        ? { calories: row.product.calories, carbs_g: row.product.carbs_g, protein_g: row.product.protein_g, fats_g: row.product.fats_g }
        : row.recipe?.nutrition ?? null
      if (!per100g) return { calories: 0, carbs_g: 0, protein_g: 0, fats_g: 0 }
      const factor = row.quantity_g / 100
      return {
        calories: Math.round(per100g.calories * factor * 10) / 10,
        carbs_g: Math.round(per100g.carbs_g * factor * 10) / 10,
        protein_g: Math.round(per100g.protein_g * factor * 10) / 10,
        fats_g: Math.round(per100g.fats_g * factor * 10) / 10,
      }
    })
  )

  async function handleAddSection(name: string) {
    const result = await addDietSection(table.id, { name }, table.diet_sections.length)
    if (result?.error) toast.error(result.error)
    else toast.success(`${PRESET_EMOJIS[name] ?? ''} ${name} added`.trim())
  }

  async function handleRenameTable() {
    if (tableName === table.name) { setEditingName(false); return }
    const result = await renameDietTable(table.id, tableName)
    if (result?.error) toast.error(result.error)
    setEditingName(false)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
            <Utensils className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            {editingName && canEdit ? (
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                onBlur={handleRenameTable}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameTable()}
                autoFocus
                className="text-xl font-bold h-9 max-w-xs"
              />
            ) : (
              <h1
                className={`text-xl font-bold truncate leading-tight ${canEdit ? 'cursor-pointer hover:underline decoration-muted-foreground' : ''}`}
                onClick={() => canEdit && setEditingName(true)}
                title={canEdit ? 'Click to rename' : undefined}
              >
                {tableName}
              </h1>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {table.diet_sections.length} {table.diet_sections.length === 1 ? 'section' : 'sections'} · {allRows.length} {allRows.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareOpen(true)}>
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
                    className="gap-2.5"
                  >
                    <span className="text-base leading-none">{PRESET_EMOJIS[preset]}</span>
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
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
            <Utensils className="size-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No sections yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {canEdit
                ? 'Use "Add Section" to start planning your meals.'
                : 'No sections have been added yet.'}
            </p>
          </div>
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
          className="mt-2"
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
