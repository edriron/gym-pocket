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

  const { data, error } = await supabase
    .from("products")
    .select("id, name, calories, carbs_g, protein_g, fats_g, serving_size_g")
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }

  const products = (data ?? []).map((p) => {
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

  if (request.headers.get("accept")?.includes("text/html")) {
    const keyParam = new URL(request.url).searchParams.get("key") ?? undefined;
    return renderApiPage({
      title: "Products",
      description: "All products with nutrition values per serving (or per 100 g when no serving size is set).",
      currentPath: "/api/public/products",
      items: products,
      keyParam,
    });
  }

  return NextResponse.json(products);
}
