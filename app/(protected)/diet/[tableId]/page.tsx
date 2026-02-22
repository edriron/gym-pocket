import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DietTableEditor } from '@/components/diet/DietTableEditor'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { DietTableWithSections } from '@/types'

interface PageProps {
  params: Promise<{ tableId: string }>
}

export default async function DietTablePage({ params }: PageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the diet table with full nested data
  const { data: rawTable } = await supabase
    .from('diet_tables')
    .select(`
      *,
      diet_sections (
        *,
        diet_rows (
          *,
          product:products (*),
          recipe:recipes (id, name)
        )
      )
    `)
    .eq('id', tableId)
    .single()

  if (!rawTable) notFound()
  const table = rawTable as unknown as DietTableWithSections

  // Check if user is the owner or has share access
  const isOwner = table.user_id === user!.id
  let canEdit = isOwner
  let hasAccess = isOwner

  if (!isOwner) {
    const { data: shareRaw } = await supabase
      .from('table_shares')
      .select('*')
      .eq('table_id', tableId)
      .eq('shared_with_id', user!.id)
      .eq('table_type', 'diet')
      .single()

    const share = shareRaw as { access_mode: 'view' | 'edit' } | null
    if (share) {
      hasAccess = true
      canEdit = share.access_mode === 'edit'
    }
  }

  if (!hasAccess) notFound()

  // Fetch shares for the owner to manage
  const { data: shares } = isOwner
    ? await supabase
        .from('table_shares')
        .select('*, profile:profiles!table_shares_shared_with_id_fkey(email, full_name)')
        .eq('table_id', tableId)
        .eq('table_type', 'diet')
    : { data: [] }

  // Fetch global products and recipes for the ingredient picker
  const [{ data: products }, { data: recipes }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('recipes').select('id, name, created_by, description, created_at, updated_at').order('name'),
  ])

  // Sort sections by sort_order
  const sortedTable = {
    ...table,
    diet_sections: [...(table.diet_sections ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }

  return (
    <div className="space-y-4">
      <Link
        href="/diet"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" /> Diet Tables
      </Link>

      <DietTableEditor
        table={sortedTable as any}
        products={products ?? []}
        recipes={recipes ?? []}
        canEdit={canEdit}
        isOwner={isOwner}
        shares={shares as any ?? []}
      />
    </div>
  )
}
