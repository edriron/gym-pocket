'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, ChefHat, Search, ShoppingBasket, Flame } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchItem {
  id: string
  name: string
  type: 'product' | 'recipe'
  calories_per_100g: number
  carbs_per_100g: number
  protein_per_100g: number
  fats_per_100g: number
}

interface CalorieConverterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceName: string
  sourceCalories: number  // total kcal for the qty eaten
}

export function CalorieConverterDialog({ open, onOpenChange, sourceName, sourceCalories }: CalorieConverterDialogProps) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<SearchItem | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setItems([])
      setSelected(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setItems([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/items-search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setItems(json.items ?? [])
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  const targetQty = selected && selected.calories_per_100g > 0
    ? Math.round((sourceCalories / selected.calories_per_100g) * 100)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flame className="size-4 text-red-500" />
            Calorie Converter
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Find how much of another item equals&nbsp;
            <span className="font-semibold text-foreground">{Math.round(sourceCalories)} kcal</span>
            &nbsp;from <span className="font-semibold text-foreground">{sourceName}</span>.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search product or recipe…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
              className="pl-8 h-9"
            />
          </div>

          {/* Results list */}
          {query.trim() && (
            <div className="rounded-lg border bg-muted/20 overflow-hidden max-h-52 overflow-y-auto">
              {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground animate-pulse">Searching…</p>
              ) : items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
              ) : (
                <ul>
                  {items.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => setSelected(item)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors',
                          selected?.id === item.id && 'bg-emerald-50 dark:bg-emerald-950/30'
                        )}
                      >
                        <span className={cn(
                          'shrink-0 flex size-6 items-center justify-center rounded-md',
                          item.type === 'recipe'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                        )}>
                          {item.type === 'recipe'
                            ? <ChefHat className="size-3.5" />
                            : <ShoppingBasket className="size-3.5" />
                          }
                        </span>
                        <span className="flex-1 truncate font-medium">{item.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {item.calories_per_100g} kcal/100g
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Result */}
          {selected && targetQty !== null && (
            <div className="rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-medium text-muted-foreground truncate max-w-[140px]">{sourceName}</span>
                <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full px-2 py-0.5 font-semibold shrink-0">
                  {Math.round(sourceCalories)} kcal
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium truncate max-w-[140px]">{selected.name}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {targetQty}
                </span>
                <span className="text-sm text-muted-foreground">g</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ≈ {Math.round(sourceCalories)} kcal
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ({selected.calories_per_100g} kcal per 100 g)
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
