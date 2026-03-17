import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkPublicApiAuth } from "../_auth";

export async function GET(request: Request) {
  const auth = checkPublicApiAuth(request);
  if (!auth.ok) {
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
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }

  const products = (data ?? []).map((p) => {
    const measure_g = p.serving_size_g ?? 100;
    const factor = measure_g / 100;
    return {
      name: p.name,
      type: "product",
      calories: Math.round(p.calories * factor * 10) / 10,
      carbs_g: Math.round(p.carbs_g * factor * 10) / 10,
      protein_g: Math.round(p.protein_g * factor * 10) / 10,
      fats_g: Math.round(p.fats_g * factor * 10) / 10,
      measure_g,
    };
  });

  return NextResponse.json(products);
}
