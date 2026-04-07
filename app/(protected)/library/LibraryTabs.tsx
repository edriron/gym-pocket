'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBasket, ChefHat } from 'lucide-react'
import type { ReactNode } from 'react'

interface LibraryTabsProps {
  defaultTab: string
  productsContent: ReactNode
  recipesContent: ReactNode
  productActions: ReactNode
  recipeActions: ReactNode
  productCount: number
  recipeCount: number
}

export function LibraryTabs({
  defaultTab,
  productsContent,
  recipesContent,
  productActions,
  recipeActions,
  productCount,
  recipeCount,
}: LibraryTabsProps) {
  return (
    <Tabs defaultValue={defaultTab}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <TabsList className="h-9 p-1">
          <TabsTrigger value="products" className="gap-2 text-sm">
            <ShoppingBasket className="size-3.5" />
            Products
            {productCount > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary leading-none">
                {productCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2 text-sm">
            <ChefHat className="size-3.5" />
            Recipes
            {recipeCount > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary leading-none">
                {recipeCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Contextual actions per tab */}
        <TabsContent value="products" className="mt-0 p-0">
          {productActions}
        </TabsContent>
        <TabsContent value="recipes" className="mt-0 p-0">
          {recipeActions}
        </TabsContent>
      </div>

      <TabsContent value="products">
        {productsContent}
      </TabsContent>

      <TabsContent value="recipes">
        {recipesContent}
      </TabsContent>
    </Tabs>
  )
}
