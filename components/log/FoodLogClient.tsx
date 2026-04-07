'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Trash2, ChefHat, CalendarDays, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AddFoodEntryDialog } from './AddFoodEntryDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { deleteFoodLog } from '@/app/(protected)/log/actions'
import { calcProductNutrition, sumNutrition, fmtNum } from '@/lib/nutrition'
import { cn } from '@/lib/utils'
import type { FoodLogWithDetails, Product, Recipe, NutritionValues } from '@/types'

interface FoodLogClientProps {
  gymDay: string          // YYYY-MM-DD from URL (or server default)
  logs: FoodLogWithDetails[]
  products: Product[]
  recipes: Recipe[]
}

/** Format a timestamptz string to local HH:MM */
function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Format YYYY-MM-DD to DD/MM/YYYY */
function fmtRawDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

/** Compute current gym day in local time (day starts at 5am) */
function localGymDay(): string {
  const now = new Date()
  if (now.getHours() < 5) {
    const prev = new Date(now)
    prev.setDate(prev.getDate() - 1)
    return prev.toISOString().split('T')[0]
  }
  return now.toISOString().split('T')[0]
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().split('T')[0]
}

function formatDisplayDate(dateStr: string): string {
  const today = localGymDay()
  const yesterday = addDays(today, -1)
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function getEntryNutrition(log: FoodLogWithDetails): NutritionValues | null {
  if (log.product) {
    return calcProductNutrition(log.product, log.quantity_g)
  }
  if (log.recipe?.nutrition) {
    const f = log.quantity_g / 100
    const n = log.recipe.nutrition
    return {
      calories: Math.round(n.calories * f * 10) / 10,
      carbs_g: Math.round(n.carbs_g * f * 10) / 10,
      protein_g: Math.round(n.protein_g * f * 10) / 10,
      fats_g: Math.round(n.fats_g * f * 10) / 10,
    }
  }
  return null
}

export function FoodLogClient({ gymDay, logs, products, recipes }: FoodLogClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // On mount: if URL gym day doesn't match local gym day, navigate to local date
  useEffect(() => {
    const local = localGymDay()
    if (gymDay !== local) {
      router.replace(`/nutrition?tab=log&date=${local}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function navigate(delta: number) {
    router.push(`/nutrition?tab=log&date=${addDays(gymDay, delta)}`)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteFoodLog(id)
    if (result?.error) toast.error(result.error)
    setDeletingId(null)
    setPendingDeleteId(null)
  }

  // Compute daily totals
  const nutritionItems = logs.map(getEntryNutrition).filter(Boolean) as NutritionValues[]
  const totals = sumNutrition(nutritionItems)
  const hasTotals = nutritionItems.length > 0

  const isToday = gymDay === localGymDay()

  return (
    <div className="space-y-5">
      {/* Date navigator */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {/* Prev day — frameless icon button */}
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2 px-1">
            <CalendarDays className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="font-semibold text-sm min-w-20 text-center">
              {formatDisplayDate(gymDay)}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {fmtRawDate(gymDay)}
            </span>
          </div>

          {/* Next day — frameless icon button, icon grays out when disabled */}
          <button
            onClick={() => { if (!isToday) navigate(1) }}
            disabled={isToday}
            className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Next day"
          >
            <ChevronRight className={cn('size-4', isToday && 'text-muted-foreground/30')} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Go to today — Undo2 icon (frameless) */}
          {!isToday && (
            <button
              onClick={() => router.push(`/nutrition?tab=log&date=${localGymDay()}`)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Go to today"
              title="Go to today"
            >
              <Undo2 className="size-4" />
            </button>
          )}

          {/* Add entry — mobile shows "+", desktop shows full label */}
          <Button
            size="sm"
            className="gap-1 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => setDialogOpen(true)}
          >
            <span className="sm:hidden">+</span>
            <span className="hidden sm:inline">+ Add Entry</span>
          </Button>
        </div>
      </div>

      {/* Daily nutrition summary */}
      {hasTotals && (
        <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Day Total ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold tabular-nums text-teal-700 dark:text-teal-300">
                  {fmtNum(totals.calories)}
                </span>
                <span className="text-xs text-muted-foreground">kcal</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tabular-nums">{fmtNum(totals.protein_g)}g</span>
                <span className="text-xs text-muted-foreground">protein</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tabular-nums">{fmtNum(totals.carbs_g)}g</span>
                <span className="text-xs text-muted-foreground">carbs</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tabular-nums">{fmtNum(totals.fats_g)}g</span>
                <span className="text-xs text-muted-foreground">fat</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center gap-3">
          <CalendarDays className="size-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">No entries for this day</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Tap &ldquo;Add Entry&rdquo; to log your food</p>
          </div>
          {/* Empty state always shows full label */}
          <Button
            size="sm"
            className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white mt-1"
            onClick={() => setDialogOpen(true)}
          >
            + Add Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const name = log.product?.name ?? log.recipe?.name ?? 'Unknown'
            const isRecipe = !!log.recipe
            const nutrition = getEntryNutrition(log)

            return (
              <div
                key={log.id}
                className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                {/* Time */}
                <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
                  {fmtTime(log.logged_at)}
                </span>

                {/* Name + badge */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="truncate text-sm font-medium">{name}</span>
                  {isRecipe && (
                    <span className="inline-flex items-center gap-0.5 shrink-0 rounded-full bg-pink-100 dark:bg-pink-900/40 px-1.5 py-0.5 text-[10px] font-medium text-pink-700 dark:text-pink-300">
                      <ChefHat className="size-2.5" /> recipe
                    </span>
                  )}
                </div>

                {/* Qty */}
                <span className="text-xs text-muted-foreground shrink-0">{log.quantity_g}g</span>

                {/* Nutrition */}
                {nutrition ? (
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="text-sm font-semibold tabular-nums text-teal-700 dark:text-teal-300">
                      {fmtNum(nutrition.calories)}
                    </span>
                    <span className="text-xs text-muted-foreground">kcal</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">—</span>
                )}

                {/* Delete — always visible on mobile, hover-only on desktop */}
                <button
                  disabled={deletingId === log.id}
                  onClick={() => setPendingDeleteId(log.id)}
                  className={cn(
                    'shrink-0 p-1 rounded transition-all hover:bg-destructive/10 disabled:opacity-40',
                    'sm:opacity-0 sm:group-hover:opacity-100'
                  )}
                  aria-label="Delete entry"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <AddFoodEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products}
        recipes={recipes}
        gymDay={gymDay}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null) }}
        title="Delete entry?"
        description="This food log entry will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => handleDelete(pendingDeleteId!)}
      />
    </div>
  )
}
