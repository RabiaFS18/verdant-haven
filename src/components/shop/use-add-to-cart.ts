import { useCallback } from "react";
import { toast } from "sonner";

import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useUi } from "@/lib/ui";

/** Adds to the cart and confirms with a toast instead of forcing the drawer open. */
export function useAddToCart() {
  const { addToCart } = useCart();
  const { open } = useUi();

  return useCallback(
    (product: Product, quantity = 1) => {
      addToCart(product.slug, quantity);
      toast.success(`${product.name} added to your cart`, {
        action: { label: "View cart", onClick: () => open("cart") },
      });
    },
    [addToCart, open],
  );
}
