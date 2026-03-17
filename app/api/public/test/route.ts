import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("products")
    .select("id, name, calories, carbs_g, protein_g, fats_g, serving_size_g, image_url")
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
