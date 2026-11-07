import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { bestSellers, categoryLabels, visibleProducts } from "@/data/products";
import { formatRs } from "@/lib/format";
import { useUi } from "@/lib/ui";

import { useAddToCart } from "./use-add-to-cart";

const MAX_RESULTS = 8;

export function SearchDialog() {
  const { bind, panel, close } = useUi();
  const addToCart = useAddToCart();
  const [query, setQuery] = useState("");

  // Start fresh every time the dialog opens.
  useEffect(() => {
    if (panel === "search") setQuery("");
  }, [panel]);

  const term = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return bestSellers(MAX_RESULTS);
    return visibleProducts()
      .filter((p) =>
        [p.name, p.description, categoryLabels[p.category]].some((field) =>
          field.toLowerCase().includes(term),
        ),
      )
      .slice(0, MAX_RESULTS);
  }, [term]);

  return (
    <Dialog {...bind("search")}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Find your next plant</DialogTitle>
          <DialogDescription>Search by plant, pot or collection name.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="absolute left-3 top-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “jasmine” or “terracotta”"
            aria-label="Search products"
            className="h-10 pl-9"
          />
        </div>

        <div className="max-h-[50vh] overflow-auto" aria-live="polite">
          <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground">
            {term
              ? `${results.length} result${results.length === 1 ? "" : "s"}`
              : "Popular right now"}
          </p>
          {results.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              No match for “{query.trim()}”. Try a plant name like “palm”, or browse the{" "}
              <Link to="/shop" onClick={close} className="font-semibold underline">
                full collection
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((product) => (
                <li
                  key={product.slug}
                  className="flex items-center justify-between gap-3 rounded-md p-3 hover:bg-muted"
                >
                  <Link
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    onClick={close}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRs(product.price)} · {categoryLabels[product.category]}
                    </p>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => {
                      addToCart(product);
                      close();
                    }}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
