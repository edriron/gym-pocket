import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { DietTableCard } from '@/components/diet/DietTableCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { CreateDietTableButton } from '@/components/diet/CreateTableDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Utensils } from 'lucide-react'

export const metadata = { title: 'Diet — Gym Pocket' }

export default async function DietPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: myTables }, { data: sharedData }] = await Promise.all([
    supabase
      .from('diet_tables')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('table_shares')
      .select('*, diet_table:diet_tables(*), profile:profiles!table_shares_shared_with_profile_fkey(email, full_name)')
      .eq('shared_with_id', user!.id)
      .eq('table_type', 'diet'),
  ])

  // For each owned table, fetch share counts
  const tableIds = (myTables ?? []).map((t) => t.id)
  const { data: sharesForOwned } = tableIds.length
    ? await supabase
        .from('table_shares')
        .select('*, profile:profiles!table_shares_shared_with_profile_fkey(email, full_name)')
        .in('table_id', tableIds)
        .eq('table_type', 'diet')
    : { data: [] }

  const sharesByTableId = (sharesForOwned ?? []).reduce<Record<string, any[]>>((acc, s) => {
    if (!acc[s.table_id]) acc[s.table_id] = []
    acc[s.table_id].push(s)
    return acc
  }, {})

  const myList = myTables ?? []
  const sharedList = sharedData ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diet Tables"
        description="Build and manage your daily meal plans."
        action={<CreateDietTableButton />}
      />

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Diet ({myList.length})</TabsTrigger>
          <TabsTrigger value="shared">Shared ({sharedList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-4">
          {myList.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No diet tables yet"
              description="Create your first diet table to plan your daily meals."
              action={<CreateDietTableButton />}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        </TabsContent>

        <TabsContent value="shared" className="mt-4">
          {sharedList.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No shared tables"
              description="When someone shares a diet table with you, it appears here."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sharedList.map((s) => (
                <DietTableCard
                  key={s.diet_table?.id}
                  table={s.diet_table as any}
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
