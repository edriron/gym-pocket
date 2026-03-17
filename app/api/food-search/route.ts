import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cache results in-process for the lifetime of the server (avoids hammering OFF)
const cache = new Map<string, { ts: number; data: unknown[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase();
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  // Return cached result if fresh
  const cached = cache.get(query);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  // Open Food Facts dedicated search service (faster and respects query terms)
  const url =
    `https://search.openfoodfacts.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&page_size=20`; // fetch more to have enough after filtering out image-less results

  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "GymPocket/1.0" },
    });
  } catch {
    return NextResponse.json({ error: "Search timed out. Try again." }, { status: 504 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: `Upstream error (${res.status})` }, { status: 502 });
  }

  const json = await res.json();
  const results = ((json.hits ?? json.products ?? []) as any[])
    .map((p) => {
      const name: string = p.product_name || p.abbreviated_product_name || ''
      const thumb: string =
        p.image_front_small_url || p.image_thumb_url || p.image_small_url || p.image_url || ''
      const imageUrl: string =
        p.image_front_url || p.image_url || thumb
      return { name, thumb, imageUrl }
    })
    .filter((p) => p.thumb && p.name)
    .slice(0, 12);

  cache.set(query, { ts: Date.now(), data: results });

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, s-maxage=300" },
  });
}
