import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WeightChart } from '@/components/weight/WeightChart'
import Link from 'next/link'
import {
  Scale, Utensils, Dumbbell, ChevronRight,
  TrendingDown, TrendingUp, Minus, ArrowRight,
  ClipboardList,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fmtNum, calcProductNutrition, sumNutrition } from '@/lib/nutrition'
import type { WeightRecord, DietTable, WorkoutTable, NutritionValues } from '@/types'

export const metadata = { title: 'Dashboard — Gym Pocket' }

function utcToday(): string {
  return new Date().toISOString().split('T')[0]
}

function gymDayBounds(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T05:00:00Z`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = utcToday()
  const { start, end } = gymDayBounds(today)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [weightRes, dietRes, workoutRes, logsRes] = await Promise.all([
    supabase
      .from('weight_records')
      .select('*')
      .eq('user_id', user!.id)
      .order('recorded_at', { ascending: false })
      .limit(30),
    supabase
      .from('diet_tables')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
      .limit(3),
    supabase
      .from('workout_tables')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
      .limit(3),
    (supabase as any)
      .from('food_logs')
      .select('quantity_g, product:products(calories, carbs_g, protein_g, fats_g), recipe_id')
      .eq('user_id', user!.id)
      .gte('logged_at', start)
      .lt('logged_at', end),
  ])

  const weightRecords = weightRes.data as WeightRecord[] | null
  const dietTables = dietRes.data as DietTable[] | null
  const dietCount = dietRes.count
  const workoutTables = workoutRes.data as WorkoutTable[] | null
  const workoutCount = workoutRes.count

  const records = weightRecords ?? []
  const latestWeight = records[0]
  const prevWeight = records[1]
  const weightDiff =
    latestWeight && prevWeight ? latestWeight.weight_kg - prevWeight.weight_kg : null

  const userName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Compute today's log summary (product entries only — recipes need RPC calls)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawLogs: any[] = logsRes.data ?? []
  const productNutritions: NutritionValues[] = rawLogs
    .filter((l: any) => l.product)
    .map((l: any) => calcProductNutrition(l.product, l.quantity_g))
  const recipeCount = rawLogs.filter((l: any) => l.recipe_id).length
  const logTotals = sumNutrition(productNutritions)
  const hasLogs = rawLogs.length > 0

  return (
    <div className="space-y-6">

      {/* Hero greeting + today's log — responsive layout */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">

        {/* Greeting */}
        <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-7">
          <div className="pointer-events-none absolute -top-10 -right-10 size-52 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 size-40 rounded-full bg-violet-500/8 blur-2xl" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground mb-0.5">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here&apos;s your fitness overview for today.
            </p>
          </div>
        </div>

        {/* Today's food log summary — inline on desktop, below on mobile */}
        <Link href="/nutrition?tab=log" className="block">
          <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-7 h-full flex flex-col justify-between hover:shadow-md transition-all hover:border-teal-200 dark:hover:border-teal-800/60 min-w-[260px] min-h-[160px]">
            <div className="pointer-events-none absolute top-0 right-0 size-24 rounded-full bg-teal-400/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
                  <ClipboardList className="size-3.5 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">Today&apos;s Log</p>
              </div>
              {hasLogs ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tabular-nums text-teal-700 dark:text-teal-300">
                      {fmtNum(logTotals.calories)}
                    </span>
                    <span className="text-sm text-muted-foreground">kcal</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="tabular-nums font-medium">{fmtNum(logTotals.protein_g)}g <span className="text-xs text-muted-foreground font-normal">P</span></span>
                    <span className="tabular-nums font-medium">{fmtNum(logTotals.carbs_g)}g <span className="text-xs text-muted-foreground font-normal">C</span></span>
                    <span className="tabular-nums font-medium">{fmtNum(logTotals.fats_g)}g <span className="text-xs text-muted-foreground font-normal">F</span></span>
                  </div>
                  {recipeCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{recipeCount} recipe {recipeCount === 1 ? 'entry' : 'entries'}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing logged yet</p>
              )}
            </div>
            <p className="relative text-xs text-teal-600 dark:text-teal-400 font-medium mt-3 flex items-center gap-1">
              View log <ArrowRight className="size-3" />
            </p>
          </div>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">

        {/* Weight */}
        <Link href="/weight">
          <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-sky-200 dark:hover:border-sky-800/60">
            <div className="pointer-events-none absolute top-0 right-0 size-24 rounded-full bg-sky-400/10 blur-2xl group-hover:bg-sky-400/20 transition-colors" />
            <CardContent className="pt-6 pb-5 relative">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40 shrink-0 group-hover:scale-105 transition-transform">
                  <Scale className="size-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Current Weight</p>
                  {latestWeight ? (
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-bold">{latestWeight.weight_kg}</span>
                      <span className="text-muted-foreground text-sm">kg</span>
                      {weightDiff !== null && (
                        <span className={`flex items-center gap-0.5 text-xs font-semibold ml-1 ${
                          weightDiff < 0 ? 'text-emerald-600 dark:text-emerald-400'
                          : weightDiff > 0 ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {weightDiff < 0 ? <TrendingDown className="size-3" />
                            : weightDiff > 0 ? <TrendingUp className="size-3" />
                            : <Minus className="size-3" />}
                          {Math.abs(weightDiff).toFixed(1)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5">No records yet</p>
                  )}
                  {latestWeight && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(latestWeight.recorded_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Diet tables */}
        <Link href="/nutrition">
          <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800/60">
            <div className="pointer-events-none absolute top-0 right-0 size-24 rounded-full bg-emerald-400/10 blur-2xl group-hover:bg-emerald-400/20 transition-colors" />
            <CardContent className="pt-6 pb-5 relative">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shrink-0 group-hover:scale-105 transition-transform">
                  <Utensils className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Diet Tables</p>
                  <p className="text-2xl font-bold mt-0.5">{dietCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">meal plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Workout tables */}
        <Link href="/workout">
          <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-orange-200 dark:hover:border-orange-800/60">
            <div className="pointer-events-none absolute top-0 right-0 size-24 rounded-full bg-orange-400/10 blur-2xl group-hover:bg-orange-400/20 transition-colors" />
            <CardContent className="pt-6 pb-5 relative">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 shrink-0 group-hover:scale-105 transition-transform">
                  <Dumbbell className="size-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Workout Tables</p>
                  <p className="text-2xl font-bold mt-0.5">{workoutCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">routines</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

      </div>

      {/* Weight chart */}
      {records.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Weight Trend
              </CardTitle>
              <Link
                href="/weight"
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <WeightChart records={records} />
          </CardContent>
        </Card>
      )}

      {/* Recent diet tables */}
      {(dietTables?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/40">
                  <Utensils className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-sm font-semibold">Recent Diet Tables</CardTitle>
              </div>
              <Link href="/nutrition" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {dietTables!.map((t) => (
                <Link
                  key={t.id}
                  href={`/diet/${t.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors group"
                >
                  <span className="font-medium text-sm">{t.name}</span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent workout tables */}
      {(workoutTables?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/40">
                  <Dumbbell className="size-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-sm font-semibold">Recent Workout Tables</CardTitle>
              </div>
              <Link href="/workout" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {workoutTables!.map((t) => (
                <Link
                  key={t.id}
                  href={`/workout/${t.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors group"
                >
                  <span className="font-medium text-sm">{t.name}</span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
