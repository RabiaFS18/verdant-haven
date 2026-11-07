import { catalog } from "@/data/catalog";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { getOptionalUserId } from "./auth.server";

/** Errors with messages that are safe to show to the shop owner. */
export class AdminError extends Error {}

export const ORDER_STATUSES = [
  "processing",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export const PAYMENT_STATUSES = ["pending", "paid", "refunded", "failed"] as const;

/** Throws unless the caller is signed in AND listed in public.admin_users. */
export async function requireAdmin() {
  const userId = await getOptionalUserId();
  if (!userId) throw new AdminError("Please sign in to continue.");

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[admin] allowlist lookup failed", error);
    throw new AdminError("Couldn’t verify admin access. Check the database setup.");
  }
  if (!data) throw new AdminError("This account does not have admin access.");
  return userId;
}

export async function whoAmI() {
  const userId = await getOptionalUserId();
  if (!userId) return { signedIn: false as const, isAdmin: false, userId: null };
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return { signedIn: true as const, isAdmin: Boolean(data), userId };
}

// ---------- Orders ----------

export async function listOrders(input: {
  status?: string | undefined;
  search?: string | undefined;
}) {
  await requireAdmin();
  let query = supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (input.status) query = query.eq("status", input.status);
  const term = input.search?.replace(/[^\p{L}\p{N}\s+@.-]/gu, "").trim();
  if (term) {
    query = query.or(
      `order_number.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }
  const { data, error } = await query;
  if (error) {
    console.error("[admin] listOrders failed", error);
    throw new AdminError("Couldn’t load orders.");
  }
  return data;
}

const ORDER_ERRORS: Record<string, string> = {
  ORDER_NOT_FOUND: "That order no longer exists.",
  INVALID_STATUS: "Invalid order status.",
  INVALID_PAYMENT_STATUS: "Invalid payment status.",
  ORDER_CANCELLED: "A cancelled order can’t be reopened. Place a new order instead.",
};

export async function updateOrder(input: {
  id: string;
  status: string;
  paymentStatus?: string | undefined;
  adminNotes?: string | undefined;
}) {
  await requireAdmin();
  const { error } = await supabaseAdmin.rpc("admin_set_order_status", {
    p_order_id: input.id,
    p_status: input.status,
    ...(input.paymentStatus ? { p_payment_status: input.paymentStatus } : {}),
    ...(input.adminNotes !== undefined ? { p_admin_notes: input.adminNotes } : {}),
  });
  if (error) {
    console.error("[admin] updateOrder failed", error);
    throw new AdminError(ORDER_ERRORS[error.message] ?? "Couldn’t update the order.");
  }
  return { ok: true as const };
}

// ---------- Products ----------

export async function listProducts() {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("slug, name, category, price, stock, is_active")
    .order("category")
    .order("name");
  if (error) {
    console.error("[admin] listProducts failed", error);
    throw new AdminError("Couldn’t load products.");
  }
  const known = new Set(data.map((p) => p.slug));
  const missing = catalog.filter((c) => !known.has(c.slug)).map((c) => c.name);
  return { products: data, missingCount: missing.length };
}

export async function updateProduct(input: {
  slug: string;
  price?: number | undefined;
  stock?: number | undefined;
  isActive?: boolean | undefined;
}) {
  await requireAdmin();
  const patch: { price?: number; stock?: number; is_active?: boolean } = {};
  if (input.price !== undefined) patch.price = input.price;
  if (input.stock !== undefined) patch.stock = input.stock;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const { error } = await supabaseAdmin.from("products").update(patch).eq("slug", input.slug);
  if (error) {
    console.error("[admin] updateProduct failed", error);
    throw new AdminError("Couldn’t save the product.");
  }
  return { ok: true as const };
}

/** Adds any catalog product that is missing from the database. Existing rows are left untouched. */
export async function syncMissingProducts() {
  await requireAdmin();
  const rows = catalog.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    light: p.light,
    water: p.water,
    rating: p.rating ?? 0,
    reviews_count: p.reviews ?? 0,
    tag: p.tag ?? null,
    image_position: p.imagePosition ?? "center",
    stock: p.stock,
  }));
  const { error } = await supabaseAdmin
    .from("products")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  if (error) {
    console.error("[admin] sync failed", error);
    throw new AdminError("Couldn’t add the missing products.");
  }
  return { ok: true as const };
}

// ---------- Dashboard ----------

const KARACHI_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" });

export async function dashboard() {
  await requireAdmin();
  const [ordersRes, stockRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("order_number, full_name, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabaseAdmin
      .from("products")
      .select("slug, name, stock, is_active")
      .lte("stock", 5)
      .order("stock"),
  ]);
  if (ordersRes.error || stockRes.error) {
    console.error("[admin] dashboard failed", ordersRes.error ?? stockRes.error);
    throw new AdminError("Couldn’t load the dashboard.");
  }

  const orders = ordersRes.data;
  const today = KARACHI_DAY.format(new Date());
  const live = orders.filter((o) => o.status !== "cancelled");
  const todays = live.filter((o) => KARACHI_DAY.format(new Date(o.created_at)) === today);

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  return {
    byStatus,
    todayOrders: todays.length,
    todayRevenue: todays.reduce((sum, o) => sum + Number(o.total), 0),
    totalOrders: orders.length,
    recent: orders.slice(0, 5),
    lowStock: stockRes.data.filter((p) => p.is_active),
  };
}
