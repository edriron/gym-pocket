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

  // Fetch full table via SECURITY DEFINER function (bypasses nested RLS issues for shared users)
  // and check ownership + share access in parallel
  const [{ data: tableJson }, { data: ownerRow }, { data: shareRow }] = await Promise.all([
    supabase.rpc('get_diet_table_detail', { p_table_id: tableId }),
    supabase.from('diet_tables').select('id').eq('id', tableId).eq('user_id', user!.id).single(),
    supabase.from('table_shares').select('access_mode')
      .eq('table_id', tableId).eq('shared_with_id', user!.id).eq('table_type', 'diet').single(),
  ])

  if (!tableJson) notFound()

  const table = tableJson as unknown as DietTableWithSections
  const isOwner = !!ownerRow
  const hasAccess = isOwner || !!shareRow
  const canEdit = isOwner || shareRow?.access_mode === 'edit'

  if (!hasAccess) notFound()

  // Fetch shares (owner only) + products + recipes in parallel
  const [sharesResult, { data: products }, { data: recipes }] = await Promise.all([
    isOwner
      ? supabase
          .from('table_shares')
          .select('*, profile:profiles!table_shares_shared_with_profile_fkey(email, full_name)')
          .eq('table_id', tableId)
          .eq('table_type', 'diet')
      : Promise.resolve({ data: [] }),
    supabase.from('products').select('*').order('name'),
    supabase.from('recipes').select('id, name, created_by, description, created_at, updated_at').order('name'),
  ])

  // Collect unique recipe IDs used in this table's rows
  const recipeIds = [
    ...new Set(
      (table.diet_sections ?? [])
        .flatMap((s) => s.diet_rows)
        .filter((r) => r.recipe_id)
        .map((r) => r.recipe_id as string)
    ),
  ]

  // Fetch nutrition for each recipe in parallel
  const nutritionMap = new Map<string, { calories: number; carbs_g: number; protein_g: number; fats_g: number }>()
  if (recipeIds.length > 0) {
    const results = await Promise.all(
      recipeIds.map((id) => supabase.rpc('get_recipe_nutrition', { p_recipe_id: id }).single())
    )
    recipeIds.forEach((id, i) => {
      const n = results[i].data as { calories: number; carbs_g: number; protein_g: number; fats_g: number; total_weight_g: number } | null
      if (n && Number(n.total_weight_g) > 0) {
        // Store as per-100g so DietRowItem can scale identically to products
        const factor = 100 / Number(n.total_weight_g)
        nutritionMap.set(id, {
          calories: Number(n.calories) * factor,
          carbs_g: Number(n.carbs_g) * factor,
          protein_g: Number(n.protein_g) * factor,
          fats_g: Number(n.fats_g) * factor,
        })
      }
    })
  }

  // Attach nutrition to recipe rows
  const sortedTable = {
    ...table,
    diet_sections: [...(table.diet_sections ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((section) => ({
        ...section,
        diet_rows: section.diet_rows.map((row) =>
          row.recipe_id && row.recipe
            ? { ...row, recipe: { ...row.recipe, nutrition: nutritionMap.get(row.recipe_id) } }
            : row
        ),
      })),
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
        shares={sharesResult.data as any ?? []}
      />
    </div>
  )
}
