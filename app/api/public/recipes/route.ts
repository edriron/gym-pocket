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

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("id, name")
    .order("name");

  if (recipesError) {
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }

  if (!recipes || recipes.length === 0) {
    if (request.headers.get("accept")?.includes("text/html")) {
      return renderApiPage({
        title: "Recipes",
        description: "All recipes with total nutrition values for the entire recipe batch.",
        currentPath: "/api/public/recipes",
        items: [],
        keyParam: new URL(request.url).searchParams.get("key") ?? undefined,
      });
    }
    return NextResponse.json([]);
  }

  const nutritionResults = await Promise.all(
    recipes.map((recipe) =>
      supabase.rpc("get_recipe_nutrition", { p_recipe_id: recipe.id }).single(),
    ),
  );

  const result = recipes.map((recipe, i) => {
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

  if (request.headers.get("accept")?.includes("text/html")) {
    const keyParam = new URL(request.url).searchParams.get("key") ?? undefined;
    return renderApiPage({
      title: "Recipes",
      description: "All recipes with total nutrition values for the entire recipe batch.",
      currentPath: "/api/public/recipes",
      items: result,
      keyParam,
    });
  }

  return NextResponse.json(result);
}
