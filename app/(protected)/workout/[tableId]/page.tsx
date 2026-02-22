import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkoutTableEditor } from '@/components/workout/WorkoutTableEditor'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ tableId: string }>
}

export default async function WorkoutTablePage({ params }: PageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: table } = await supabase
    .from('workout_tables')
    .select('*, workout_exercises(*)')
    .eq('id', tableId)
    .single()

  if (!table) notFound()

  const isOwner = table.user_id === user!.id
  let canEdit = isOwner
  let hasAccess = isOwner

  if (!isOwner) {
    const { data: share } = await supabase
      .from('table_shares')
      .select('*')
      .eq('table_id', tableId)
      .eq('shared_with_id', user!.id)
      .eq('table_type', 'workout')
      .single()

    if (share) {
      hasAccess = true
      canEdit = share.access_mode === 'edit'
    }
  }

  if (!hasAccess) notFound()

  const { data: shares } = isOwner
    ? await supabase
        .from('table_shares')
        .select('*, profile:profiles!table_shares_shared_with_id_fkey(email, full_name)')
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
