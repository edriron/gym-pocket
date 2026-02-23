import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { WorkoutTableCard } from '@/components/workout/WorkoutTableCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { CreateWorkoutTableButton } from '@/components/workout/CreateWorkoutTableDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dumbbell } from 'lucide-react'

export const metadata = { title: 'Workout — Gym Pocket' }

export default async function WorkoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: myTables }, { data: sharedResult }] = await Promise.all([
    supabase
      .from('workout_tables')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    // RPC does a server-side JOIN with SECURITY DEFINER — avoids RLS subquery issues
    supabase.rpc('get_my_shared_workout_tables'),
  ])

  type SharedWorkoutItem = { id: string; access_mode: 'view' | 'edit'; workout_table: { id: string; user_id: string; name: string; created_at: string; updated_at: string } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharedList: SharedWorkoutItem[] = (sharedResult ?? []).map((row: any) => ({
    id: row.share_id as string,
    access_mode: row.access_mode as 'view' | 'edit',
    workout_table: {
      id: row.id as string,
      user_id: row.user_id as string,
      name: row.name as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    },
  }))

  // Share counts + profile info for owned tables (for the ShareTableDialog)
  const tableIds = (myTables ?? []).map((t) => t.id)
  const { data: sharesForOwned } = tableIds.length
    ? await supabase
        .from('table_shares')
        .select('*, profile:profiles!table_shares_shared_with_profile_fkey(email, full_name)')
        .in('table_id', tableIds)
        .eq('table_type', 'workout')
    : { data: [] }

  const sharesByTableId = (sharesForOwned ?? []).reduce<Record<string, any[]>>((acc, s) => {
    if (!acc[s.table_id]) acc[s.table_id] = []
    acc[s.table_id].push(s)
    return acc
  }, {})

  const myList = myTables ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workout Tables"
        description="Build and manage your workout routines."
        action={<CreateWorkoutTableButton />}
      />

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Workouts ({myList.length})</TabsTrigger>
          <TabsTrigger value="shared">Shared ({sharedList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-4">
          {myList.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No workout tables yet"
              description="Create your first workout table to track your exercises."
              action={<CreateWorkoutTableButton />}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myList.map((table) => (
                <WorkoutTableCard
                  key={table.id}
                  table={table}
                  isOwner
                  shareCount={sharesByTableId[table.id]?.length ?? 0}
                  shares={sharesByTableId[table.id] ?? []}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-4">
          {sharedList.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No shared workouts"
              description="When someone shares a workout table with you, it appears here."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sharedList.map((s) => (
                <WorkoutTableCard
                  key={s.id}
                  table={s.workout_table as any}
                  isOwner={false}
                  accessMode={s.access_mode}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
