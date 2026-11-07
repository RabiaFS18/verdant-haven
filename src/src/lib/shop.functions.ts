import { createServerFn } from "@tanstack/react-start";

import { newsletterSchema, orderInputSchema } from "@/lib/checkout-schema";

// Server-only modules are imported inside the handlers so the browser bundle never contains them.

export const placeOrderFn = createServerFn({ method: "POST" })
  .validator(orderInputSchema)
  .handler(async ({ data }) => {
    const { placeOrder } = await import("@/server/orders.server");
    return placeOrder(data);
  });

export const subscribeNewsletterFn = createServerFn({ method: "POST" })
  .validator(newsletterSchema)
  .handler(async ({ data }) => {
    const { subscribe } = await import("@/server/newsletter.server");
    await subscribe(data.email);
    return { ok: true as const };
  });
