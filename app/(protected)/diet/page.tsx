import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { DietTableCard } from '@/components/diet/DietTableCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { CreateDietTableButton } from '@/components/diet/CreateTableDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Utensils, Users } from 'lucide-react'

export const metadata = { title: 'Diet — Gym Pocket' }

export default async function DietPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: myTables }, { data: sharedResult }, { data: sharesForOwned }] = await Promise.all([
    supabase
      .from('diet_tables')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.rpc('get_my_shared_diet_tables'),
    supabase
      .from('table_shares')
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diet Tables"
        description="Build and manage your daily meal plans."
        action={<CreateDietTableButton />}
        icon={Utensils}
        iconColor="emerald"
      />

      <Tabs defaultValue="my">
        <TabsList className="h-9 p-1">
          <TabsTrigger value="my" className="gap-2 text-sm">
            <Utensils className="size-3.5" />
            My Diet
            {myList.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary leading-none">
                {myList.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-2 text-sm">
            <Users className="size-3.5" />
            Shared
            {sharedList.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary leading-none">
                {sharedList.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-5">
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
        </TabsContent>

        <TabsContent value="shared" className="mt-5">
          {sharedList.length === 0 ? (
            <EmptyState
              icon={Users}
              iconColor="sky"
              title="No shared tables"
              description="When someone shares a diet table with you, it will appear here."
            />
          ) : (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
