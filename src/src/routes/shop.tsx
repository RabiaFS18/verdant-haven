import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/data/products";
import { CATEGORIES, categoryLabels, visibleProducts, type ProductCategory } from "@/data/products";
import { pageHead } from "@/lib/seo";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

type Sort = (typeof SORTS)[number]["value"];
type ShopSearch = { category?: ProductCategory; sort?: Sort };

const isCategory = (v: unknown): v is ProductCategory =>
  typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
const isSort = (v: unknown): v is Sort => SORTS.some((s) => s.value === v);

export const Route = createFileRoute("/shop")({
  // Filters live in the URL (?category=indoor&sort=price-asc) so views can be shared and bookmarked.
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const result: ShopSearch = {};
    if (isCategory(search["category"])) result.category = search["category"];
    if (isSort(search["sort"]) && search["sort"] !== "featured") result.sort = search["sort"];
    return result;
  },
  head: () =>
    pageHead({
      title: "Shop All Plants",
      description:
        "Browse the full Verdant Haven collection: indoor plants, outdoor plants, seeds, pots, and care essentials.",
    }),
  component: ShopPage,
});

/** Builds the next search state, dropping a key entirely when it is cleared. */
function nextSearch(
  prev: ShopSearch,
  change: ShopSearch & { clear?: "category" | "sort" },
): ShopSearch {
  const { category, sort } = prev;
  const merged: ShopSearch = {};
  const nextCategory = change.clear === "category" ? undefined : (change.category ?? category);
  const nextSort = change.clear === "sort" ? undefined : (change.sort ?? sort);
  if (nextCategory) merged.category = nextCategory;
  if (nextSort) merged.sort = nextSort;
  return merged;
}

function sortProducts(list: Product[], sort: Sort) {
  const copy = [...list];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "rating":
      return copy.sort(
        (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0),
      );
    default:
      return copy;
  }
}

function ShopPage() {
  const { category, sort = "featured" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const visible = sortProducts(
    category ? visibleProducts().filter((p) => p.category === category) : visibleProducts(),
    sort,
  );

  return (
    <section className="container-page py-14 lg:py-20">
      <PageHeader eyebrow="The full collection" title="Shop all plants">
        <p>Every plant, pot, and care essential we grow and curate, all in one place.</p>
      </PageHeader>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant={category ? "outline" : "default"}>
            <Link
              to="/shop"
              search={(prev) => nextSearch(prev, { clear: "category" })}
              aria-current={category ? undefined : "true"}
            >
              All
            </Link>
          </Button>
          {CATEGORIES.map((value) => (
            <Button
              key={value}
              asChild
              size="sm"
              variant={category === value ? "default" : "outline"}
            >
              <Link
                to="/shop"
                search={(prev) => nextSearch(prev, { category: value })}
                aria-current={category === value ? "true" : undefined}
              >
                {categoryLabels[value]}
              </Link>
            </Button>
          ))}
        </nav>

        <Select
          value={sort}
          onValueChange={(value) =>
            void navigate({
              search: (prev) =>
                nextSearch(
                  prev,
                  value === "featured" ? { clear: "sort" } : { sort: value as Sort },
                ),
              replace: true,
              resetScroll: false,
            })
          }
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Sort products">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? "product" : "products"}
      </p>
      <div className="mt-4">
        <ProductGrid products={visible} />
      </div>
    </section>
  );
}
