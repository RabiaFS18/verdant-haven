import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FREE_DELIVERY_THRESHOLD, MAX_QTY_PER_ITEM } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatRs } from "@/lib/format";
import { useUi } from "@/lib/ui";
import { ProductImage } from "./product-image";

export function CartDrawer() {
  const { bind, close } = useUi();
  const { lines, subtotal, delivery, total, amountToFreeDelivery, setQuantity } = useCart();
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <Sheet {...bind("cart")}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your cart</SheetTitle>
          <SheetDescription>
            {lines.length ? "Review your plants before checkout." : "Your cart is empty."}
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <ShoppingBag className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">No plants here yet.</p>
              <Button asChild variant="outline" className="mt-5" onClick={close}>
                <Link to="/shop">Browse the collection</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-md bg-soft-sage p-3 text-sm">
              {amountToFreeDelivery > 0 ? (
                <p>
                  Add <strong>{formatRs(amountToFreeDelivery)}</strong> more for free delivery.
                </p>
              ) : (
                <p>You’ve unlocked free delivery.</p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="mt-5 flex-1 space-y-5 overflow-auto">
              {lines.map(({ product, quantity, lineTotal }) => (
                <li key={product.slug} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
                  <Link
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    onClick={close}
                    className="aspect-square overflow-hidden rounded-md bg-muted"
                  >
                    <ProductImage product={product} decorative className="" />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="shrink-0 font-semibold">{formatRs(lineTotal)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-md border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setQuantity(product.slug, quantity - 1)}
                          aria-label={
                            quantity === 1 ? `Remove ${product.name}` : "Decrease quantity"
                          }
                        >
                          {quantity === 1 ? (
                            <Trash2 className="size-3.5" />
                          ) : (
                            <Minus className="size-3.5" />
                          )}
                        </Button>
                        <span className="w-8 text-center text-sm" aria-live="polite">
                          {quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={quantity >= Math.min(MAX_QTY_PER_ITEM, product.stock)}
                          onClick={() => setQuantity(product.slug, quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRs(product.price)} each
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t pt-5">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatRs(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd>{delivery === 0 ? "Free" : formatRs(delivery)}</dd>
                </div>
                <div className="flex justify-between pt-2 font-display text-xl">
                  <dt>Total</dt>
                  <dd>{formatRs(total)}</dd>
                </div>
              </dl>
              <Button asChild variant="accent" className="mt-4 h-11 w-full" onClick={close}>
                <Link to="/checkout">Go to checkout</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Pay by cash on delivery. No payment is taken online.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
