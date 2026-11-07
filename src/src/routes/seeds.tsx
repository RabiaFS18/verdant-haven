import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shop/collection-page";
import { productsByCategory } from "@/data/products";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/seeds")({
  head: () =>
    pageHead({
      title: "Seeds",
      description:
        "Flower, herb and garden seeds to sow at home: marigold, sunflower, tulsi, coriander, jasmine and more.",
    }),
  component: () => (
    <CollectionPage
      eyebrow="Start from the very beginning"
      title="Seeds"
      intro="Flowers, herbs and favourites to sow in pots or beds. Each pack lists the light and watering it needs, so you can start with confidence."
      products={productsByCategory("seeds")}
    />
  ),
});
