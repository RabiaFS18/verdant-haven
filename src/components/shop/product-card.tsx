import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star, Sun, Waves } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isSoldOut, type Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ProductImage } from "./product-image";
import { useAddToCart } from "./use-add-to-cart";

export function ProductCard({ product }: { product: Product }) {
  const { isWishlisted, toggleWishlist } = useCart();
  const addToCart = useAddToCart();
  const liked = isWishlisted(product.slug);
  const soldOut = isSoldOut(product);

  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          aria-label={`View ${product.name}`}
          className="block size-full"
        >
          <ProductImage
            product={product}
            loading="lazy"
            className="transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        {(soldOut || product.tag) && (
          <Badge className="absolute left-3 top-3 border-0 bg-background/90 text-foreground backdrop-blur">
            {soldOut ? "Sold out" : product.tag}
          </Badge>
        )}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => toggleWishlist(product.slug)}
          aria-pressed={liked}
          aria-label={
            liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`
          }
          className="absolute right-3 top-3 rounded-full bg-background/90 shadow-sm hover:bg-background"
        >
          <Heart className={cn(liked && "fill-terracotta text-terracotta")} />
        </Button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {product.rating !== undefined && (
          <div className="flex items-center gap-1 text-xs text-terracotta">
            <Star className="size-3.5 fill-current" aria-hidden="true" />
            <span className="font-bold text-foreground">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({product.reviews ?? 0})</span>
          </div>
        )}
        <div className="mt-2 flex items-start justify-between gap-2">
          <h3 className="text-lg leading-tight sm:text-xl">
            <Link to="/products/$slug" params={{ slug: product.slug }} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          <span className="shrink-0 text-sm font-bold">{formatRs(product.price)}</span>
        </div>
        {product.light !== "—" && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sun className="size-3" aria-hidden="true" />
              {product.light}
            </span>
            <span className="flex items-center gap-1">
              <Waves className="size-3" aria-hidden="true" />
              {product.water}
            </span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-auto w-full"
          onClick={() => addToCart(product)}
          disabled={soldOut}
          aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
        >
          {soldOut ? (
            "Sold out"
          ) : (
            <>
              Add to cart <ShoppingBag />
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
