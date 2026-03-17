"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import sharp from "sharp";
import type { ProductFormValues } from "@/lib/validations";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Normalise MIME type and resize to ≤ 5 MB, converting everything to JPEG. */
async function normaliseImage(input: ArrayBuffer, _contentType: string): Promise<{ buffer: Buffer; contentType: "image/jpeg" }> {
  const buf = await sharp(Buffer.from(input))
    .rotate()                  // auto-orient from EXIF
    .jpeg({ quality: 85 })    // convert to JPEG
    .toBuffer();

  if (buf.byteLength <= MAX_BYTES) {
    return { buffer: buf, contentType: "image/jpeg" };
  }

  // Progressively lower quality until under 5 MB
  for (const quality of [70, 55, 40, 25]) {
    const smaller = await sharp(Buffer.from(input)).rotate().jpeg({ quality }).toBuffer();
    if (smaller.byteLength <= MAX_BYTES) {
      return { buffer: smaller, contentType: "image/jpeg" };
    }
  }

  // Last resort: also shrink dimensions to 1200px wide
  const resized = await sharp(Buffer.from(input))
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 60 })
    .toBuffer();
  return { buffer: resized, contentType: "image/jpeg" };
}

export async function addProduct(values: ProductFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("products").insert({
    created_by: user.id,
    name: values.name,
    description: values.description || null,
    calories: values.calories,
    carbs_g: values.carbs_g,
    protein_g: values.protein_g,
    fats_g: values.fats_g,
    serving_size_g: values.serving_size_g ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/products");
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("products")
    .update({
      name: values.name,
      description: values.description || null,
      calories: values.calories,
      carbs_g: values.carbs_g,
      protein_g: values.protein_g,
      fats_g: values.fats_g,
      serving_size_g: values.serving_size_g ?? null,
    })
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) return { error: error.message };
  revalidatePath("/products");
  revalidatePath("/recipes");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) return { error: error.message };
  revalidatePath("/products");
}

export async function importProducts(products: ProductFormValues[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const payload = products.map((p) => ({
    created_by: user.id,
    name: p.name,
    description: p.description ?? null,
    calories: p.calories,
    carbs_g: p.carbs_g,
    protein_g: p.protein_g,
    fats_g: p.fats_g,
    serving_size_g: p.serving_size_g ?? null,
  }));

  const { error } = await supabase.from("products").upsert(payload, {
    onConflict: "name",
    ignoreDuplicates: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/products");

  return { success: true };
}

// ── Image helpers ──────────────────────────────────────────────

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function assertOwner(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("created_by", user.id)
    .single();
  if (!data) return { error: "Not found or not authorized" as const };

  return { user, supabase };
}

/** Called after a client-side storage upload to persist the public URL. */
export async function saveProductImageUrl(productId: string, publicUrl: string | null) {
  const result = await assertOwner(productId);
  if ("error" in result) return result;
  const { supabase } = result;

  const { error } = await supabase
    .from("products")
    .update({ image_url: publicUrl })
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath("/products");
}

/** Server-side: fetch an image URL and upload it to storage, then persist URL. */
export async function fetchAndUploadProductImage(
  productId: string,
  imageUrl: string,
): Promise<{ error: string } | { publicUrl: string }> {
  const result = await assertOwner(productId);
  if ("error" in result) return { error: result.error! };
  const { supabase } = result;

  let response: Response;
  try {
    response = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
  } catch {
    return { error: "Could not reach that URL." };
  }
  if (!response.ok) return { error: `Failed to fetch image (${response.status}).` };

  const rawContentType = response.headers.get("content-type") ?? "image/jpeg";
  if (!rawContentType.startsWith("image/")) return { error: "URL does not point to an image." };

  const raw = await response.arrayBuffer();

  let buffer: Buffer;
  let contentType: string;
  try {
    ({ buffer, contentType } = await normaliseImage(raw, rawContentType));
  } catch {
    return { error: "Could not process image. The file may be corrupt or unsupported." };
  }

  const svc = serviceClient();
  const { error: uploadError } = await svc.storage
    .from("product-images")
    .upload(productId, buffer, { upsert: true, contentType });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = svc.storage
    .from("product-images")
    .getPublicUrl(productId);

  const { error: dbError } = await supabase
    .from("products")
    .update({ image_url: publicUrl })
    .eq("id", productId);

  if (dbError) return { error: dbError.message };
  revalidatePath("/products");
  return { publicUrl };
}

/** Remove product image from storage and clear the DB field. */
export async function deleteProductImage(productId: string) {
  const result = await assertOwner(productId);
  if ("error" in result) return result;
  const { supabase } = result;

  const svc = serviceClient();
  await svc.storage.from("product-images").remove([productId]);

  const { error } = await supabase
    .from("products")
    .update({ image_url: null })
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath("/products");
}
