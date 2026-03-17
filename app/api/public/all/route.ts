import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkPublicApiAuth } from "../_auth";
import { renderApiPage } from "../_render";

export async function GET(request: Request) {
  const auth = checkPublicApiAuth(request);
  if (!auth.ok) {
    if (request.headers.get("accept")?.includes("text/html")) {
      return new Response(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:#dc2626"><h2>401 Unauthorized</h2><p>${auth.error}</p></body></html>`,
        { status: 401, headers: { "Content-Type": "text/html" } }
      );
    }
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [
    { data: productsData, error: productsError },
    { data: recipesData, error: recipesError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, calories, carbs_g, protein_g, fats_g, serving_size_g")
      .order("name"),
    supabase.from("recipes").select("id, name").order("name"),
  ]);

  if (productsError || recipesError) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }

  const products = (productsData ?? []).map((p) => {
    const measure_g = p.serving_size_g ?? 100;
    const factor = measure_g / 100;
    return {
      name: p.name,
      type: "product" as const,
      calories: Math.round(p.calories * factor * 10) / 10,
      carbs_g: Math.round(p.carbs_g * factor * 10) / 10,
      protein_g: Math.round(p.protein_g * factor * 10) / 10,
      fats_g: Math.round(p.fats_g * factor * 10) / 10,
      measure_g,
    };
  });

  const recipes = recipesData ?? [];
  const nutritionResults = await Promise.all(
    recipes.map((recipe) =>
      supabase.rpc("get_recipe_nutrition", { p_recipe_id: recipe.id }).single(),
    ),
  );

  const recipeItems = recipes.map((recipe, i) => {
    const nutrition = nutritionResults[i].data as {
      calories: number;
      carbs_g: number;
      protein_g: number;
      fats_g: number;
      total_weight_g: number;
    } | null;

    return {
      name: recipe.name,
      type: "recipe" as const,
      calories: nutrition ? Math.round(Number(nutrition.calories) * 10) / 10 : 0,
      carbs_g: nutrition ? Math.round(Number(nutrition.carbs_g) * 10) / 10 : 0,
      protein_g: nutrition ? Math.round(Number(nutrition.protein_g) * 10) / 10 : 0,
      fats_g: nutrition ? Math.round(Number(nutrition.fats_g) * 10) / 10 : 0,
      measure_g: nutrition ? Math.round(Number(nutrition.total_weight_g) * 10) / 10 : 0,
    };
  });

  const combined = [...products, ...recipeItems];

  if (request.headers.get("accept")?.includes("text/html")) {
    const keyParam = new URL(request.url).searchParams.get("key") ?? undefined;
    return renderApiPage({
      title: "All Items",
      description: "All products and recipes combined, sorted alphabetically within each group.",
      currentPath: "/api/public/all",
      items: combined,
      keyParam,
    });
  }

  return NextResponse.json(combined);
}
