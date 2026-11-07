import { catalog } from "@/data/catalog";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "@/data/site";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { OrderInput } from "@/lib/checkout-schema";

import { getOptionalUserId } from "./auth.server";

export class OrderError extends Error {}

const nameOf = (slug: string) => catalog.find((p) => p.slug === slug)?.name ?? "An item";

/** Turns database exception codes into messages a customer can act on. */
function friendlyMessage(raw: string): string {
  const [code, slug = ""] = raw.split(":");
  switch (code) {
    case "OUT_OF_STOCK":
      return `${nameOf(slug)} doesn’t have enough stock for this quantity. Lower the quantity and try again.`;
    case "UNKNOWN_PRODUCT":
      return `${nameOf(slug)} is no longer available. Remove it from your cart and try again.`;
    case "EMPTY_CART":
      return "Your cart is empty.";
    default:
      return "We couldn’t place your order. Please try again in a moment.";
  }
}

export async function placeOrder(input: OrderInput) {
  try {
    return await createOrder(input);
  } catch (error) {
    if (error instanceof OrderError) throw error;
    // Configuration or network problems: log the detail, show the customer something useful.
    console.error("[orders] unexpected failure", error);
    throw new OrderError("Ordering is temporarily unavailable. Please try again in a few minutes.");
  }
}

async function createOrder(input: OrderInput) {
  const userId = await getOptionalUserId();

  // The database prices the order from its own product table and decrements
  // stock in one transaction — nothing the browser sends can change a price.
  const { data, error } = await supabaseAdmin.rpc("place_order", {
    p_customer: input.customer,
    p_items: input.items,
    ...(userId ? { p_user_id: userId } : {}),
    p_free_delivery_threshold: FREE_DELIVERY_THRESHOLD,
    p_delivery_fee: DELIVERY_FEE,
  });

  if (error) {
    console.error("[orders] place_order failed", error);
    throw new OrderError(friendlyMessage(error.message));
  }

  const result = data as { order_number: string; total: number };
  return { orderNumber: result.order_number, total: Number(result.total) };
}
