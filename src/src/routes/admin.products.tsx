import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProductsFn, syncProductsFn, updateProductFn } from "@/lib/admin.functions";
import { categoryLabels } from "@/data/products";
import type { ProductCategory } from "@/data/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

type Row = {
  slug: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  is_active: boolean;
};

function ProductRow({ product }: { product: Row }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [price, setPrice] = useState(String(Math.round(Number(product.price))));
  const [stock, setStock] = useState(String(product.stock));
  const [active, setActive] = useState(product.is_active);

  const priceNum = Number(price);
  const stockNum = Number(stock);
  const valid =
    price.trim() !== "" &&
    stock.trim() !== "" &&
    Number.isInteger(priceNum) &&
    priceNum >= 0 &&
    Number.isInteger(stockNum) &&
    stockNum >= 0;
  const dirty =
    priceNum !== Math.round(Number(product.price)) ||
    stockNum !== product.stock ||
    active !== product.is_active;

  const save = useMutation({
    mutationFn: () =>
      updateProductFn({
        data: { slug: product.slug, price: priceNum, stock: stockNum, isActive: active },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await router.invalidate(); // refresh the shop's prices and stock too
      toast.success(`${product.name} saved`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn’t save."),
  });

  return (
    <li
      className={cn(
        "grid gap-3 rounded-md border bg-card p-4 md:grid-cols-[1.6fr_8rem_6rem_6rem_auto] md:items-center",
        !active && "opacity-60",
      )}
    >
      <div>
        <p className="font-semibold">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {categoryLabels[product.category as ProductCategory] ?? product.category}
        </p>
      </div>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Price (Rs)
        <Input
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-invalid={!valid || undefined}
          className="h-9 text-foreground"
        />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Stock
        <Input
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className={cn("h-9 text-foreground", stockNum <= 5 && "border-terracotta")}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        On shop
      </label>
      <Button size="sm" disabled={!dirty || !valid || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving…" : "Save"}
      </Button>
    </li>
  );
}

function ProductsPage() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const query = useQuery({ queryKey: ["admin", "products"], queryFn: () => listProductsFn() });
  const sync = useMutation({
    mutationFn: () => syncProductsFn(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Missing products added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn’t add products."),
  });

  if (query.isPending) return <p className="text-muted-foreground">Loading products…</p>;
  if (query.isError) {
    return (
      <div>
        <p className="text-destructive">
          {query.error instanceof Error ? query.error.message : "Couldn’t load products."}
        </p>
        <Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const term = text.trim().toLowerCase();
  const rows = (query.data.products as Row[]).filter(
    (p) => (!term || p.name.toLowerCase().includes(term)) && (!lowOnly || p.stock <= 5),
  );

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Change a price or stock level and press Save. It appears on the shop straight away. Untick
          “On shop” to hide a product without deleting it.
        </p>
      </div>

      {query.data.missingCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-terracotta bg-card p-4 text-sm">
          <p>
            <strong>{query.data.missingCount}</strong> products on the website aren’t in the
            database yet, so they can’t be ordered or edited here.
          </p>
          <Button
            size="sm"
            variant="accent"
            disabled={sync.isPending}
            onClick={() => sync.mutate()}
          >
            {sync.isPending ? "Adding…" : "Add them now"}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search
            className="absolute left-3 top-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="h-10 pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Low stock only (5 or fewer)
        </label>
        <p className="text-sm text-muted-foreground sm:ml-auto">{rows.length} shown</p>
      </div>

      <ul className="grid gap-2">
        {rows.map((p) => (
          // Re-key on saved values so the inputs reset to what the database now holds.
          <ProductRow key={`${p.slug}:${p.price}:${p.stock}:${p.is_active}`} product={p} />
        ))}
      </ul>
    </div>
  );
}
