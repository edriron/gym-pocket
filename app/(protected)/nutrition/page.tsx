import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { DietTableCard } from '@/components/diet/DietTableCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { CreateDietTableButton } from '@/components/diet/CreateTableDialog'
import { FoodLogClient } from '@/components/log/FoodLogClient'
import { NutritionTabs } from './NutritionTabs'
import { Utensils, Users, ClipboardList } from 'lucide-react'
import type { FoodLogWithDetails, NutritionValues, Product, Recipe } from '@/types'

export const metadata = { title: 'Nutrition — Gym Pocket' }

/** Get the gym-day bounds (5am–5am) in UTC for a given YYYY-MM-DD string */
function gymDayBounds(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T05:00:00Z`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function utcToday(): string {
  return new Date().toISOString().split('T')[0]
}

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string }>
}) {
  const { tab, date: rawDate } = await searchParams
  const activeTab = tab === 'log' ? 'log' : 'diet'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Diet data (always fetch for diet tab, also used by header action) ──
  const [{ data: myTables }, { data: sharedResult }, { data: sharesForOwned }] = await Promise.all([
    supabase.from('diet_tables').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.rpc('get_my_shared_diet_tables'),
    supabase.from('table_shares')
      .select('*, profile:profiles!table_shares_shared_with_profile_fkey(email, full_name)')
      .eq('owner_id', user!.id)
      .eq('table_type', 'diet'),
  ])

  type SharedDietItem = { id: string; access_mode: 'view' | 'edit'; diet_table: { id: string; user_id: string; name: string; created_at: string; updated_at: string } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharedList: SharedDietItem[] = (sharedResult ?? []).map((row: any) => ({
    id: row.share_id as string,
    access_mode: row.access_mode as 'view' | 'edit',
    diet_table: {
      id: row.id as string,
      user_id: row.user_id as string,
      name: row.name as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    },
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharesByTableId = (sharesForOwned ?? []).reduce<Record<string, any[]>>((acc, s) => {
    if (!acc[s.table_id]) acc[s.table_id] = []
    acc[s.table_id].push(s)
    return acc
  }, {})
  const myList = myTables ?? []

  // ── Log data (only fetch when log tab is active) ──
  let logContent: React.ReactNode = null
  if (activeTab === 'log') {
    const gymDay = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : utcToday()
    const { start, end } = gymDayBounds(gymDay)

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

    const recipeIds = [...new Set(rawLogs.filter((l) => l.recipe_id).map((l) => l.recipe_id!))]
    const recipeNutritionMap = new Map<string, NutritionValues>()
    if (recipeIds.length > 0) {
      const nutritionResults = await Promise.all(
        recipeIds.map(async (id) => {
          const { data } = await supabase.rpc('get_recipe_nutrition', { p_recipe_id: id }).single()
          return { id, nutrition: data as NutritionValues | null }
        })
      )
      for (const { id, nutrition } of nutritionResults) {
        if (nutrition) recipeNutritionMap.set(id, nutrition)
      }
    }

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

    logContent = (
      <FoodLogClient
        gymDay={gymDay}
        logs={logs}
        products={products}
        recipes={recipes}
      />
    )
  }

  const dietContent = (
    <>
      {/* Inner Diet / Shared sub-tabs handled by DietSubTabs client component below */}
      <div className="space-y-5">
        <DietSubTabs
          myList={myList}
          sharedList={sharedList}
          sharesByTableId={sharesByTableId}
        />
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition"
        description="Plan your diet tables and track your daily food intake."
        icon={Utensils}
        iconColor="emerald"
        action={activeTab === 'diet' ? <CreateDietTableButton /> : undefined}
      />

      <Suspense fallback={null}>
        <NutritionTabs
          defaultTab={activeTab}
          dietContent={dietContent}
          logContent={logContent ?? <LogPlaceholder />}
          myDietCount={myList.length}
        />
      </Suspense>
    </div>
  )
}

// ── Inline sub-components (server) ──────────────────────────────────────────

function DietSubTabs({
  myList,
  sharedList,
  sharesByTableId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  myList: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedList: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharesByTableId: Record<string, any[]>
}) {
  return (
    <div className="space-y-5">
      {/* My tables section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Utensils className="size-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            My Diet Tables
            {myList.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary leading-none normal-case">
                {myList.length}
              </span>
            )}
          </h3>
        </div>
        {myList.length === 0 ? (
          <EmptyState
            icon={Utensils}
            iconColor="emerald"
            title="No diet tables yet"
            description="Create your first diet table to start planning your daily meals."
            action={<CreateDietTableButton />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myList.map((table) => (
              <DietTableCard
                key={table.id}
                table={table}
                isOwner
                shareCount={sharesByTableId[table.id]?.length ?? 0}
                shares={sharesByTableId[table.id] ?? []}
              />
            ))}
          </div>
        )}
      </div>

      {/* Shared section */}
      {sharedList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Shared With Me
              <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary leading-none normal-case">
                {sharedList.length}
              </span>
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedList.map((s) => (
              <DietTableCard
                key={s.id}
                table={s.diet_table as any}
                isOwner={false}
                accessMode={s.access_mode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LogPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center gap-3">
      <ClipboardList className="size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">Loading food log...</p>
    </div>
  )
}
