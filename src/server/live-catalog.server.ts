import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type LiveRow = { slug: string; price: number; stock: number; isActive: boolean };

/**
 * Price, stock and visibility come from the database so the owner can change them in /admin.
 * If the backend isn't configured (or is down) the shop falls back to the built-in catalog.
 */
export async function liveCatalog(): Promise<LiveRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("slug, price, stock, is_active");
    if (error) throw error;
    return data.map((r) => ({
      slug: r.slug,
      price: Number(r.price),
      stock: r.stock,
      isActive: r.is_active,
    }));
  } catch (error) {
    console.warn(
      "[catalog] using built-in catalog:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
