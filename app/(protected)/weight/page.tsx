import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { WeightTable } from '@/components/weight/WeightTable'
import { WeightChart } from '@/components/weight/WeightChart'
import { AddWeightButton } from './WeightClientSection'
import { Scale } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

export const metadata = { title: 'Weight Tracker — Gym Pocket' }

export default async function WeightPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: records } = await supabase
    .from('weight_records')
    .select('*')
    .eq('user_id', user!.id)
    .order('recorded_at', { ascending: false })

  const sorted = records ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weight Tracker"
        description="Log and monitor your body weight over time."
        action={<AddWeightButton />}
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No weight records yet"
          description="Start logging your weight to see your progress over time."
          action={<AddWeightButton />}
        />
      ) : (
        <>
          {/* Chart */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Weight Trend
            </h2>
            <WeightChart records={sorted} />
          </div>

          {/* Table */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Records
            </h2>
            <WeightTable records={sorted} />
          </div>
        </>
      )}
    </div>
  )
}
