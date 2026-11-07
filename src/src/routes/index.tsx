import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, Leaf, ShieldCheck, Sparkles, Sprout, Truck } from "lucide-react";

import heroImage from "@/assets/verdant-hero.webp";
import { SectionHeading } from "@/components/common/section-heading";
import { ProductGrid } from "@/components/shop/product-grid";
import { Testimonials } from "@/components/shop/testimonials";
import { Button } from "@/components/ui/button";
import { bestSellers, categoryTiles, communityPhotos } from "@/data/products";
import { FREE_DELIVERY_THRESHOLD } from "@/data/site";
import { formatRs } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useUi } from "@/lib/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageHead({
      title: "Verdant Haven",
      description:
        "Shop premium indoor and outdoor plants, artisan pots, and expert plant care from Verdant Haven.",
      image: heroImage,
    }),
    links: [{ rel: "preload", as: "image", href: heroImage, fetchPriority: "high" }],
  }),
  component: HomePage,
});

const promises = [
  {
    icon: Truck,
    title: "Free delivery",
    text: `On orders over ${formatRs(FREE_DELIVERY_THRESHOLD)}`,
  },
  { icon: ShieldCheck, title: "30-day guarantee", text: "Happiness, guaranteed" },
  { icon: Leaf, title: "Ethically grown", text: "By trusted growers" },
  { icon: Sparkles, title: "Expert support", text: "Care help, whenever" },
];

const tileClass = "group relative aspect-[3/4] overflow-hidden rounded-md bg-muted";
/** With five tiles, the last one spans the full row on two-column phones. */
const wideOnPhone = "max-sm:col-span-2 max-sm:aspect-[2/1]";

/** The "both" tile deep-links into the shop with its filter applied; the others are plain pages. */
function TileLink({
  to,
  wide,
  children,
}: {
  to: (typeof categoryTiles)[number]["to"];
  wide: boolean;
  children: ReactNode;
}) {
  return to === "/shop" ? (
    <Link to="/shop" search={{ category: "both" }} className={cn(tileClass, wide && wideOnPhone)}>
      {children}
    </Link>
  ) : (
    <Link to={to} className={cn(tileClass, wide && wideOnPhone)}>
      {children}
    </Link>
  );
}

function HomePage() {
  const { open } = useUi();

  return (
    <>
      <section className="relative max-h-[880px] min-h-[calc(100svh-104px)] overflow-hidden">
        <img
          src={heroImage}
          alt="A warm sunlit living room filled with lush houseplants"
          width={1920}
          height={1152}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-[64%_center]"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="container-page relative flex max-h-[880px] min-h-[calc(100svh-104px)] items-end pb-14 pt-28 sm:items-center sm:pb-20">
          <div className="max-w-2xl animate-fade-in text-hero-foreground">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <Sprout className="size-4" aria-hidden="true" /> Grown with care, chosen for you
            </p>
            <h1 className="text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-7xl">
              Bring Nature Home
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-hero-foreground/90 sm:text-xl">
              Curated plants for modern spaces, delivered from our greenhouse to your haven.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent" className="h-12 px-6 shadow-lg">
                <Link to="/shop">
                  Shop the collection <ArrowRight />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-hero-foreground/50 bg-background/10 px-6 text-hero-foreground backdrop-blur-sm hover:bg-background/20 hover:text-hero-foreground"
                onClick={() => open("quiz")}
              >
                Take the Plant Match quiz
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Our promises" className="border-b border-border bg-soft-sage">
        <ul className="container-page grid grid-cols-2 divide-x divide-y divide-border/70 sm:grid-cols-4 sm:divide-y-0">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3 px-3 py-5 sm:justify-center sm:px-5">
              <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page py-20 lg:py-28">
        <SectionHeading eyebrow="Find your green" title="Shop by category" action="Explore all" />
        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {categoryTiles.map((tile, index) => (
            <TileLink key={tile.name} to={tile.to} wide={index === categoryTiles.length - 1}>
              <img
                src={tile.image}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-card-overlay" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-hero-foreground sm:p-6">
                <p className="font-display text-xl sm:text-2xl">{tile.name}</p>
                <p className="mt-1 hidden text-sm text-hero-foreground/85 sm:block">{tile.note}</p>
                <ArrowRight className="mt-3 size-5 transition-transform group-hover:translate-x-1" />
              </div>
            </TileLink>
          ))}
        </div>
      </section>

      <section className="bg-section py-20 lg:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="Loved by plant people"
            title="Our best sellers"
            action="Shop all plants"
          />
          <div className="mt-9">
            <ProductGrid products={bestSellers(4)} />
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-[1fr_auto] lg:py-20">
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-sage">
              <Sparkles className="size-4" aria-hidden="true" /> Your perfect plant is waiting
            </p>
            <h2 className="max-w-2xl text-4xl leading-tight sm:text-5xl">
              Not sure which plant suits your home?
            </h2>
            <p className="mt-4 max-w-xl text-primary-foreground/80">
              Answer three quick questions about light, pets and how much time you have. We’ll
              suggest a plant that will thrive with you.
            </p>
          </div>
          <Button size="lg" variant="accent" className="h-12" onClick={() => open("quiz")}>
            Find my perfect plant <ArrowRight />
          </Button>
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow mb-5">From our community</p>
            <Testimonials />
          </div>
          <div>
            <div className="grid grid-cols-2 gap-2">
              {communityPhotos.map((photo) => (
                <div key={photo.alt} className="aspect-square overflow-hidden rounded-sm bg-muted">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm font-medium">
              Tag <span className="text-terracotta">#VerdantHaven</span> to be featured
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
