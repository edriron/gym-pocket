'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import type { Product, Recipe } from '@/types'

interface IngredientPickerProps {
  products: Product[]
  recipes: Recipe[]
  excludeRecipeId?: string
  onSelect: (item: { id: string; name: string; type: 'product' | 'recipe' }) => void
}

export function IngredientPicker({
  products,
  recipes,
  excludeRecipeId,
  onSelect,
}: IngredientPickerProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const filteredRecipes = recipes.filter((r) => r.id !== excludeRecipeId)

  function handleSelect(id: string, name: string, type: 'product' | 'recipe') {
    setValue('')
    setOpen(false)
    onSelect({ id, name, type })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || 'Search products & recipes...'}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {products.length > 0 && (
              <CommandGroup heading="Products">
                {products.map((p) => (
                  <CommandItem
                    key={`product-${p.id}`}
                    value={`product-${p.name}`}
                    onSelect={() => handleSelect(p.id, p.name, 'product')}
                  >
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.calories} kcal/100g
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredRecipes.length > 0 && (
              <>
                {products.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Recipes">
                  {filteredRecipes.map((r) => (
                    <CommandItem
                      key={`recipe-${r.id}`}
                      value={`recipe-${r.name}`}
                      onSelect={() => handleSelect(r.id, r.name, 'recipe')}
                    >
                      <span className="flex-1 truncate">{r.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">recipe</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
