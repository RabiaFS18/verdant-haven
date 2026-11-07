import type { ReactNode } from "react";

import { PageHeader } from "@/components/common/page-header";
import type { Product } from "@/data/products";

import { ProductGrid } from "./product-grid";

type CollectionPageProps = {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  products: Product[];
};

/** Shared layout for the indoor, outdoor and pots pages. */
export function CollectionPage({ eyebrow, title, intro, products }: CollectionPageProps) {
  return (
    <section className="container-page py-14 lg:py-20">
      <PageHeader eyebrow={eyebrow} title={title}>
        <p>{intro}</p>
      </PageHeader>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
