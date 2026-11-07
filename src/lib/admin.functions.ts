import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-only modules are imported inside the handlers so the browser bundle never contains them.

export const liveCatalogFn = createServerFn({ method: "GET" }).handler(async () => {
  const { liveCatalog } = await import("@/server/live-catalog.server");
  return liveCatalog();
});

export const whoAmIFn = createServerFn({ method: "GET" }).handler(async () => {
  const { whoAmI } = await import("@/server/admin.server");
  return whoAmI();
});

export const dashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const { dashboard } = await import("@/server/admin.server");
  return dashboard();
});

export const listOrdersFn = createServerFn({ method: "POST" })
  .validator(
    z.object({ status: z.string().max(20).optional(), search: z.string().max(80).optional() }),
  )
  .handler(async ({ data }) => {
    const { listOrders } = await import("@/server/admin.server");
    return listOrders(data);
  });

export const updateOrderFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["processing", "confirmed", "shipped", "delivered", "cancelled"]),
      paymentStatus: z.enum(["pending", "paid", "refunded", "failed"]).optional(),
      adminNotes: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { updateOrder } = await import("@/server/admin.server");
    return updateOrder(data);
  });

export const listProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listProducts } = await import("@/server/admin.server");
  return listProducts();
});

export const updateProductFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      slug: z.string().min(1).max(100),
      price: z.number().int().min(0).max(10_000_000).optional(),
      stock: z.number().int().min(0).max(100_000).optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { updateProduct } = await import("@/server/admin.server");
    return updateProduct(data);
  });

export const syncProductsFn = createServerFn({ method: "POST" }).handler(async () => {
  const { syncMissingProducts } = await import("@/server/admin.server");
  return syncMissingProducts();
});
