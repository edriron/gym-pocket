import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WeightChart } from '@/components/weight/WeightChart'
import Link from 'next/link'
import { Scale, Utensils, Dumbbell, ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { WeightRecord, DietTable, WorkoutTable } from '@/types'

export const metadata = { title: 'Dashboard — Gym Pocket' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [weightRes, dietRes, workoutRes] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hey, {userName}!</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your fitness overview.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {/* Latest weight */}
        <Link href="/weight">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Scale className="size-4" /> Current Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestWeight ? (
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{latestWeight.weight_kg}</span>
                  <span className="text-base text-muted-foreground mb-1">kg</span>
                  {weightDiff !== null && (
                    <span
                      className={`ml-1 mb-1 text-sm font-medium flex items-center gap-0.5 ${
                        weightDiff < 0
                          ? 'text-green-600'
                          : weightDiff > 0
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {weightDiff < 0 ? (
                        <TrendingDown className="size-4" />
                      ) : weightDiff > 0 ? (
                        <TrendingUp className="size-4" />
                      ) : (
                        <Minus className="size-4" />
                      )}
                      {Math.abs(weightDiff).toFixed(1)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No records yet</p>
              )}
              {latestWeight && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(latestWeight.recorded_at), 'MMM d, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Diet tables */}
        <Link href="/diet">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Utensils className="size-4" /> Diet Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dietCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">meal plans created</p>
            </CardContent>
          </Card>
        </Link>

        {/* Workout tables */}
        <Link href="/workout">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Dumbbell className="size-4" /> Workout Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workoutCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">workout routines</p>
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
                Weight Trend (last 30 records)
              </CardTitle>
              <Link
                href="/weight"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="size-3" />
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
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Diet Tables
              </CardTitle>
              <Link href="/diet" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dietTables!.map((t) => (
                <Link
                  key={t.id}
                  href={`/diet/${t.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium text-sm">{t.name}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent workout tables */}
      {(workoutTables?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Workout Tables
              </CardTitle>
              <Link href="/workout" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workoutTables!.map((t) => (
                <Link
                  key={t.id}
                  href={`/workout/${t.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium text-sm">{t.name}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
