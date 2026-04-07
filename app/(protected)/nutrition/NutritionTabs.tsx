'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Utensils, ClipboardList } from 'lucide-react'
import type { ReactNode } from 'react'

interface NutritionTabsProps {
  defaultTab: string
  dietContent: ReactNode
  logContent: ReactNode
  myDietCount: number
}

export function NutritionTabs({ defaultTab, dietContent, logContent, myDietCount }: NutritionTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'diet') {
      params.delete('tab')
      params.delete('date')
    } else {
      params.set('tab', value)
    }
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`)
  }

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
      <TabsList className="h-9 p-1">
        <TabsTrigger value="diet" className="gap-2 text-sm">
          <Utensils className="size-3.5" />
          Diet
          {myDietCount > 0 && (
            <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary leading-none">
              {myDietCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="log" className="gap-2 text-sm">
          <ClipboardList className="size-3.5" />
          Food Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="diet" className="mt-5">
        {dietContent}
      </TabsContent>

      <TabsContent value="log" className="mt-5">
        {logContent}
      </TabsContent>
    </Tabs>
  )
}
