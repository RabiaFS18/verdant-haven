import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, Minus, PackageCheck, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { useState } from "react";

import { ProductGrid } from "@/components/shop/product-grid";
import { ProductImage } from "@/components/shop/product-image";
import { useAddToCart } from "@/components/shop/use-add-to-cart";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  categoryLabels,
  findProduct,
  getProduct,
  isLivePlant,
  isSoldOut,
  relatedProducts,
  type Product,
} from "@/data/products";
import { FREE_DELIVERY_THRESHOLD, MAX_QTY_PER_ITEM } from "@/data/site";
import { liveCatalogFn } from "@/lib/admin.functions";
import { useCart } from "@/lib/cart";
import { formatRs } from "@/lib/format";
import { absoluteUrl, pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const base = findProduct(params.slug);
    if (!base) throw notFound();
    // Use the owner's live price and visibility for the page title, schema and 404 handling.
    let rows: Awaited<ReturnType<typeof liveCatalogFn>> = [];
    try {
      rows = await liveCatalogFn();
    } catch {
      // Built-in catalog is the fallback.
    }
    const row = rows.find((r) => r.slug === base.slug);
    if (row && !row.isActive) throw notFound();
    return { product: row ? { ...base, price: row.price, stock: row.stock } : base };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) return {};
    const base = pageHead({
      title: product.name,
      description: product.description,
      ...(product.image ? { image: product.image } : {}),
    });
    const image = product.image ? absoluteUrl(product.image) : undefined;
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      ...(image ? { image } : {}),
      ...(product.rating !== undefined && product.reviews
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviews,
            },
          }
        : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "PKR",
        price: product.price,
        availability: "https://schema.org/InStock",
      },
    };
    return {
      ...base,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(structuredData) }],
    };
  },
  notFoundComponent: () => (
    <section className="container-page py-24 text-center">
      <h1 className="text-4xl">We couldn’t find that product</h1>
      <p className="mt-3 text-muted-foreground">
        It may have been renamed or is no longer available.
      </p>
      <Button asChild className="mt-6">
        <Link to="/shop">Back to the shop</Link>
      </Button>
    </section>
  ),
  component: ProductPage,
});

const careLabels = { easy: "Easy", moderate: "Moderate", challenging: "Needs experience" } as const;

function facts(product: Product) {
  const rows: [string, string][] = [];
  if (isLivePlant(product) || product.category === "bare" || product.category === "seeds") {
    rows.push(["Light", product.light], ["Watering", product.water]);
  }
  if (product.careLevel) rows.push(["Care level", careLabels[product.careLevel]]);
  if (product.petSafe !== undefined) {
    rows.push(["Pets", product.petSafe ? "Pet-friendly" : "Not pet-safe, keep out of reach"]);
  }
  return rows;
}

function ProductPage() {
  const { slug } = Route.useParams();
  // Read the live product (not the loader copy) so price and stock match the rest of the shop.
  const { product: loaded } = Route.useLoaderData();
  const product = getProduct(slug) ?? loaded;
  const { isWishlisted, toggleWishlist } = useCart();
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);

  const soldOut = isSoldOut(product);
  const max = Math.max(1, Math.min(MAX_QTY_PER_ITEM, product.stock));
  const liked = isWishlisted(product.slug);
  const rows = facts(product);

  return (
    <article className="container-page py-8 lg:py-12">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/shop">Shop</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/shop" search={{ category: product.category }}>
                {categoryLabels[product.category]}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-[4/5] overflow-hidden rounded-md bg-muted">
          <ProductImage product={product} fetchPriority="high" />
        </div>

        <div className="lg:py-4">
          {product.tag && <Badge variant="secondary">{product.tag}</Badge>}
          <h1 className="mt-3 text-4xl sm:text-5xl">{product.name}</h1>
          {product.rating !== undefined && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Star className="size-4 fill-current text-terracotta" aria-hidden="true" />
              <span className="font-bold">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviews ?? 0} reviews)</span>
            </div>
          )}
          <p className="mt-5 font-display text-3xl">{formatRs(product.price)}</p>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {rows.length > 0 && (
            <dl className="mt-8 divide-y rounded-md border">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus />
              </Button>
              <span className="w-10 text-center font-semibold" aria-live="polite">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(max, q + 1))}
                disabled={quantity >= max}
                aria-label="Increase quantity"
              >
                <Plus />
              </Button>
            </div>
            <Button
              variant="accent"
              className="h-10 flex-1 sm:flex-none sm:px-10"
              onClick={() => addToCart(product, quantity)}
              disabled={soldOut}
            >
              {soldOut ? "Sold out" : `Add to cart · ${formatRs(product.price * quantity)}`}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggleWishlist(product.slug)}
              aria-pressed={liked}
              aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn(liked && "fill-terracotta text-terracotta")} />
            </Button>
          </div>

          <ul className="mt-8 grid gap-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <Truck className="size-4 text-primary" aria-hidden="true" /> Free delivery over{" "}
              {formatRs(FREE_DELIVERY_THRESHOLD)} · pay cash on delivery
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> 30-day happiness
              guarantee
            </li>
            <li className="flex items-center gap-3">
              <PackageCheck className="size-4 text-primary" aria-hidden="true" /> Packed in
              recyclable, cushioned packaging
            </li>
          </ul>
        </div>
      </div>

      <section aria-labelledby="related" className="mt-20">
        <h2 id="related" className="text-3xl sm:text-4xl">
          You may also like
        </h2>
        <div className="mt-8">
          <ProductGrid products={relatedProducts(product)} />
        </div>
      </section>
    </article>
  );
}
