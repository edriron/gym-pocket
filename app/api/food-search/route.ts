import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FoodResult = { name: string; thumb: string; imageUrl: string };

// Per-source in-process cache
const cache = new Map<string, { ts: number; data: FoodResult[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function searchPexels(query: string): Promise<FoodResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error("PEXELS_API_KEY is not configured");

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=square`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: apiKey },
  });
  if (!res.ok) throw new Error(`Pexels error (${res.status})`);

  const json = await res.json();
  return ((json.photos ?? []) as any[]).map((p) => ({
    name: p.alt || query,
    thumb: p.src.small as string,
    imageUrl: p.src.large as string,
  }));
}

async function searchOpenFoodFacts(query: string): Promise<FoodResult[]> {
  const url =
    `https://search.openfoodfacts.org/search` +
    `?q=${encodeURIComponent(query)}&page_size=20`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": "GymPocket/1.0" },
  });
  if (!res.ok) throw new Error(`Open Food Facts error (${res.status})`);

  const json = await res.json();
  return ((json.hits ?? json.products ?? []) as any[])
    .map((p) => {
      const name: string = p.product_name || p.abbreviated_product_name || "";
      const thumb: string =
        p.image_front_small_url || p.image_thumb_url || p.image_small_url || p.image_url || "";
      const imageUrl: string = p.image_front_url || p.image_url || thumb;
      return { name, thumb, imageUrl };
    })
    .filter((p) => p.thumb && p.name)
    .slice(0, 12);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase();
  const source = searchParams.get("source") === "off" ? "off" : "pexels";
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const cacheKey = `${source}:${query}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  let results: FoodResult[];
  try {
    results = source === "off"
      ? await searchOpenFoodFacts(query)
      : await searchPexels(query);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Search failed." }, { status: 502 });
  }

  cache.set(cacheKey, { ts: Date.now(), data: results });
  return NextResponse.json(results, { headers: { "Cache-Control": "public, s-maxage=300" } });
}
