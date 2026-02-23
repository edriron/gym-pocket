import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkoutTableEditor } from '@/components/workout/WorkoutTableEditor'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { WorkoutTableWithExercises } from '@/types'

interface PageProps {
  params: Promise<{ tableId: string }>
}

export default async function WorkoutTablePage({ params }: PageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch full table via SECURITY DEFINER function (bypasses nested RLS issues for shared users)
  // and check ownership + share access in parallel
  const [{ data: tableJson }, { data: ownerRow }, { data: shareRow }] = await Promise.all([
    supabase.rpc('get_workout_table_detail', { p_table_id: tableId }),
    supabase.from('workout_tables').select('id').eq('id', tableId).eq('user_id', user!.id).single(),
    supabase.from('table_shares').select('access_mode')
      .eq('table_id', tableId).eq('shared_with_id', user!.id).eq('table_type', 'workout').single(),
  ])

  if (!tableJson) notFound()

  const table = tableJson as unknown as WorkoutTableWithExercises
  const isOwner = !!ownerRow
  const hasAccess = isOwner || !!shareRow
  const canEdit = isOwner || shareRow?.access_mode === 'edit'

  if (!hasAccess) notFound()

  // Fetch shares (owner only)
  const { data: shares } = isOwner
    ? await supabase
        .from('table_shares')
        .select('*, profile:profiles!table_shares_shared_with_profile_fkey(email, full_name)')
        .eq('table_id', tableId)
        .eq('table_type', 'workout')
    : { data: [] }

  return (
    <div className="space-y-4">
      <Link
        href="/workout"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" /> Workout Tables
      </Link>

      <WorkoutTableEditor
        table={table as any}
        canEdit={canEdit}
        isOwner={isOwner}
        shares={shares as any ?? []}
      />
    </div>
  )
}
