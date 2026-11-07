import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import type { Product } from "@/data/products";

import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center">
        <p className="font-semibold">Nothing here yet</p>
        <p className="mt-1 text-sm text-muted-foreground">No products match this filter.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/shop">See everything</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
