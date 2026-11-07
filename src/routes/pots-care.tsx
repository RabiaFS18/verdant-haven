import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shop/collection-page";
import { productsByCategory } from "@/data/products";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/pots-care")({
  head: () =>
    pageHead({
      title: "Pots & Plant Care",
      description:
        "Artisan ceramic pots, terracotta classics, and organic care essentials to keep your plants thriving.",
    }),
  component: () => (
    <CollectionPage
      eyebrow="Everything they need"
      title="Pots & care"
      intro="Hand-glazed ceramics, breathable terracotta, and organic potting mixes: the finishing touches your plants deserve."
      products={productsByCategory("pots")}
    />
  ),
});
