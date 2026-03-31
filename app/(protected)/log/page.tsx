import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { FoodLogClient } from '@/components/log/FoodLogClient'
import { ClipboardList } from 'lucide-react'
import type { FoodLogWithDetails, NutritionValues, Product, Recipe } from '@/types'

export const metadata = { title: 'Food Log — Gym Pocket' }

/** Get the gym-day bounds (5am–5am) in UTC for a given YYYY-MM-DD string */
function gymDayBounds(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T05:00:00Z`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Returns YYYY-MM-DD for UTC "today" */
function utcToday(): string {
  return new Date().toISOString().split('T')[0]
}

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: rawDate } = await searchParams
  // Validate date format; fall back to UTC today
  const gymDay = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : utcToday()
  const { start, end } = gymDayBounds(gymDay)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch logs, products and recipes in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logsRes, productsRes, recipesRes] = await Promise.all([
    (supabase as any)
      .from('food_logs')
      .select('*, product:products(*), recipe:recipes(id, name)')
      .eq('user_id', user!.id)
      .gte('logged_at', start)
      .lt('logged_at', end)
      .order('logged_at', { ascending: true }),
    supabase.from('products').select('*').order('name'),
    supabase.from('recipes').select('*').order('name'),
  ])

  const rawLogs: FoodLogWithDetails[] = logsRes.data ?? []
  const products: Product[] = productsRes.data ?? []
  const recipes: Recipe[] = recipesRes.data ?? []

  // For any recipe entries, fetch nutrition via RPC
  const recipeIds = [...new Set(rawLogs.filter((l) => l.recipe_id).map((l) => l.recipe_id!))]
  const recipeNutritionMap = new Map<string, NutritionValues>()

  if (recipeIds.length > 0) {
    const nutritionResults = await Promise.all(
      recipeIds.map(async (id) => {
        const { data } = await supabase.rpc('get_recipe_nutrition', { p_recipe_id: id })
        return { id, nutrition: data as NutritionValues | null }
      })
    )
    for (const { id, nutrition } of nutritionResults) {
      if (nutrition) recipeNutritionMap.set(id, nutrition)
    }
  }

  // Attach nutrition to recipe entries
  const logs: FoodLogWithDetails[] = rawLogs.map((log) => {
    if (log.recipe_id && recipeNutritionMap.has(log.recipe_id)) {
      return {
        ...log,
        recipe: log.recipe
          ? { ...log.recipe, nutrition: recipeNutritionMap.get(log.recipe_id) }
          : log.recipe,
      }
    }
    return log
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food Log"
        description="Track what you eat throughout the day."
        icon={ClipboardList}
        iconColor="teal"
      />
      <FoodLogClient
        gymDay={gymDay}
        logs={logs}
        products={products}
        recipes={recipes}
      />
    </div>
  )
}
