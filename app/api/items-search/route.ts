import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  const [productsRes, recipesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, calories, carbs_g, protein_g, fats_g')
      .ilike('name', `%${q}%`)
      .limit(6),
    supabase
      .from('recipes')
      .select('id, name')
      .ilike('name', `%${q}%`)
      .limit(6),
  ])

  const products = (productsRes.data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    type: 'product' as const,
    calories_per_100g: Number(p.calories),
    carbs_per_100g: Number(p.carbs_g),
    protein_per_100g: Number(p.protein_g),
    fats_per_100g: Number(p.fats_g),
  }))

  // Fetch recipe nutrition via RPC in parallel
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const recipeResults = await Promise.all(
    (recipesRes.data ?? []).map(async (r) => {
      const { data } = await svc.rpc('get_recipe_nutrition', { p_recipe_id: r.id })
      const n = data as { calories: number; carbs_g: number; protein_g: number; fats_g: number; total_weight_g: number } | null
      const totalWeight = n?.total_weight_g ?? 100
      return {
        id: r.id,
        name: r.name,
        type: 'recipe' as const,
        calories_per_100g: n ? Math.round((n.calories / totalWeight) * 100 * 10) / 10 : null,
        carbs_per_100g: n ? Math.round((n.carbs_g / totalWeight) * 100 * 10) / 10 : null,
        protein_per_100g: n ? Math.round((n.protein_g / totalWeight) * 100 * 10) / 10 : null,
        fats_per_100g: n ? Math.round((n.fats_g / totalWeight) * 100 * 10) / 10 : null,
      }
    })
  )

  // Only return recipes with known nutrition
  const recipes = recipeResults.filter(r => r.calories_per_100g !== null)

  return NextResponse.json({ items: [...products, ...recipes] })
}
