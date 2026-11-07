import { Leaf, Sprout } from "lucide-react";

import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  product: Product;
  className?: string;
  /** Decorative when the product name is already shown next to the image. */
  decorative?: boolean;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * Shows the product photo, or an honest placeholder when none has been added yet.
 * Never substitutes a photo of a different plant.
 */
export function ProductImage({
  product,
  className,
  decorative = false,
  loading,
  fetchPriority,
}: ProductImageProps) {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={decorative ? "" : product.name}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={cn("size-full object-cover", className)}
        style={{ objectPosition: product.imagePosition ?? "center" }}
      />
    );
  }

  const Icon = product.category === "seeds" ? Sprout : Leaf;
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : `${product.name} (photo coming soon)`}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "grid size-full place-items-center bg-gradient-to-br from-soft-sage to-muted text-primary/60",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <Icon className="size-1/4 min-h-6 min-w-6 max-h-12 max-w-12" aria-hidden="true" />
        <span className="text-xs font-medium text-muted-foreground">Photo coming soon</span>
      </div>
    </div>
  );
}
