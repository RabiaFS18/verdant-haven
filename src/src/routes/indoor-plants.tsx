import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shop/collection-page";
import { productsByCategory } from "@/data/products";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/indoor-plants")({
  head: () =>
    pageHead({
      title: "Indoor Plants",
      description:
        "Premium indoor plants for every light level — from easy-care spider plants to statement areca palms.",
    }),
  component: () => (
    <CollectionPage
      eyebrow="Make every room breathe"
      title="Indoor plants"
      intro="Hand-picked houseplants that thrive indoors, chosen for beauty and resilience."
      products={productsByCategory("indoor")}
    />
  ),
});
