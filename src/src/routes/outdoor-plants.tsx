import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shop/collection-page";
import { productsByCategory } from "@/data/products";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/outdoor-plants")({
  head: () =>
    pageHead({
      title: "Outdoor Plants",
      description:
        "Sun-loving outdoor plants — fragrant jasmine, blooming periwinkle, and hardy favorites for gardens and balconies.",
    }),
  component: () => (
    <CollectionPage
      eyebrow="Grown for sun and breeze"
      title="Outdoor plants"
      intro="Hardy, blooming favorites for gardens, patios, and balconies, nurtured by trusted growers."
      products={productsByCategory("outdoor")}
    />
  ),
});
