import { Link } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatRs } from "@/lib/format";
import { useUi } from "@/lib/ui";
import { ProductImage } from "./product-image";

import { useAddToCart } from "./use-add-to-cart";

export function WishlistDrawer() {
  const { bind, close } = useUi();
  const { wishlist, toggleWishlist } = useCart();
  const addToCart = useAddToCart();

  return (
    <Sheet {...bind("wishlist")}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your wishlist</SheetTitle>
          <SheetDescription>
            {wishlist.length
              ? "Saved on this device."
              : "Tap the heart on any plant to save it here."}
          </SheetDescription>
        </SheetHeader>

        {wishlist.length === 0 ? (
          <div className="grid flex-1 place-items-center">
            <Heart className="size-9 text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <ul className="mt-6 flex-1 space-y-5 overflow-auto">
            {wishlist.map((product) => (
              <li key={product.slug} className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-3">
                <Link
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  onClick={close}
                  className="aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <ProductImage product={product} decorative className="" />
                </Link>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{formatRs(product.price)}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => addToCart(product)}
                  >
                    Add to cart
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => toggleWishlist(product.slug)}
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
