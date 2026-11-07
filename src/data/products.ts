import snakePlant from "@/assets/real-plants/snake-plant.webp";
import moneyPlant from "@/assets/real-plants/money-plant.webp";
import fanPalm from "@/assets/real-plants/fan-palm.webp";
import monstera from "@/assets/real-plants/monstera.webp";
import weepingFig from "@/assets/real-plants/weeping-fig.webp";
import ponytailPalm from "@/assets/real-plants/ponytail-palm.webp";
import bambooPalm from "@/assets/real-plants/bamboo-palm.webp";
import calathea from "@/assets/real-plants/calathea.webp";
import periwinkleWhite from "@/assets/real-plants/periwinkle-white.webp";
import babySunRose from "@/assets/real-plants/baby-sun-rose.webp";
import dracaena from "@/assets/real-plants/dracaena.webp";
import syngonium from "@/assets/real-plants/syngonium.webp";
import jadeBonsai from "@/assets/real-plants/jade-bonsai.webp";
import raatKiRani from "@/assets/real-plants/raat-ki-rani.webp";
import frangipani from "@/assets/real-plants/frangipani.webp";
import ixora from "@/assets/real-plants/ixora.webp";
import mint from "@/assets/real-plants/mint.webp";
import curryLeaf from "@/assets/real-plants/curry-leaf.webp";
import lemon from "@/assets/real-plants/lemon.webp";
import aglaonema from "@/assets/real-plants/aglaonema.webp";
import rubberPlant from "@/assets/real-plants/rubber-plant.webp";
import aloeVera from "@/assets/real-plants/aloe-vera.webp";
import hibiscus from "@/assets/real-plants/hibiscus.webp";
import rose from "@/assets/real-plants/rose.webp";
import marigold from "@/assets/real-plants/marigold.webp";
import arecaPalm from "@/assets/real-plants/areca-palm.webp";
import croton from "@/assets/real-plants/croton.jpg";
import crownOfThorns from "@/assets/real-plants/crown-of-thorns.jpg";
import desertRose from "@/assets/real-plants/desert-rose.webp";
import dieffenbachia from "@/assets/real-plants/dieffenbachia.jpg";
import jasmine from "@/assets/real-plants/jasmine.jpg";
import periwinkle from "@/assets/real-plants/periwinkle.jpg";
import spiderPlant from "@/assets/real-plants/spider-plant.jpg";

import { catalog, type CatalogEntry, type ImageKey, type ProductCategory } from "./catalog";

export { CATEGORIES } from "./catalog";
export type { CareLevel, LightLevel, ProductCategory } from "./catalog";

const images: Record<ImageKey, string> = {
  "fan-palm": fanPalm,
  monstera: monstera,
  "weeping-fig": weepingFig,
  "ponytail-palm": ponytailPalm,
  "bamboo-palm": bambooPalm,
  calathea: calathea,
  "periwinkle-white": periwinkleWhite,
  "baby-sun-rose": babySunRose,
  dracaena: dracaena,
  syngonium: syngonium,
  "jade-bonsai": jadeBonsai,
  "raat-ki-rani": raatKiRani,
  frangipani: frangipani,
  ixora: ixora,
  mint: mint,
  "curry-leaf": curryLeaf,
  lemon: lemon,
  "snake-plant": snakePlant,
  "money-plant": moneyPlant,
  aglaonema: aglaonema,
  "rubber-plant": rubberPlant,
  "aloe-vera": aloeVera,
  hibiscus: hibiscus,
  rose: rose,
  marigold: marigold,
  "areca-palm": arecaPalm,
  croton,
  "crown-of-thorns": crownOfThorns,
  "desert-rose": desertRose,
  dieffenbachia,
  jasmine,
  periwinkle,
  "spider-plant": spiderPlant,
};

export type Product = Omit<CatalogEntry, "imageKey"> & { image?: string; hidden?: boolean };

export const products: Product[] = catalog.map(({ imageKey, ...entry }) =>
  imageKey ? { ...entry, image: images[imageKey] } : entry,
);

const bySlug = new Map(products.map((p) => [p.slug, p]));
const base = new Map(products.map((p) => [p.slug, { price: p.price, stock: p.stock }]));

export type LiveRow = { slug: string; price: number; stock: number; isActive: boolean };

/**
 * Layers the owner's live price, stock and visibility (from the database) over the built-in
 * catalog. Called while rendering the root route so the server and the browser agree.
 * Returns a key that changes whenever any of those values change.
 */
export function applyLiveCatalog(rows: LiveRow[]): string {
  const live = new Map(rows.map((r) => [r.slug, r]));
  for (const product of products) {
    const original = base.get(product.slug)!;
    const row = live.get(product.slug);
    product.price = row ? row.price : original.price;
    product.stock = row ? row.stock : original.stock;
    product.hidden = row ? !row.isActive : false;
  }
  return products.map((p) => `${p.slug}:${p.price}:${p.stock}:${p.hidden ? 0 : 1}`).join("|");
}

/** Everything a shopper may see: hidden products are excluded. */
export const visibleProducts = () => products.filter((p) => !p.hidden);

export const isSoldOut = (p: Product) => p.stock <= 0;

/** Ignores visibility; used by loaders that apply the live data themselves. */
export const findProduct = (slug: string): Product | undefined => bySlug.get(slug);

export const getProduct = (slug: string): Product | undefined => {
  const product = bySlug.get(slug);
  return product && !product.hidden ? product : undefined;
};

export const isLivePlant = (p: Product) =>
  p.category === "indoor" || p.category === "outdoor" || p.category === "both";

export const productsByCategory = (...categories: ProductCategory[]) =>
  visibleProducts().filter((p) => categories.includes(p.category));

/** Live plants ranked by review count — drives the homepage "best sellers" row. */
export const bestSellers = (limit = 4) =>
  visibleProducts()
    .filter(isLivePlant)
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, limit);

export const relatedProducts = (product: Product, limit = 4) =>
  visibleProducts()
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .concat(
      visibleProducts().filter((p) => p.slug !== product.slug && p.category !== product.category),
    )
    .slice(0, limit);

export const categoryLabels: Record<ProductCategory, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Indoor & outdoor",
  seeds: "Seeds",
  bare: "Without pot",
  pots: "Pots & care",
};

export const communityPhotos = [
  { src: crownOfThorns, alt: "Pink crown of thorns flowers in a nursery pot" },
  { src: jasmine, alt: "White jasmine flowers growing outdoors" },
  { src: periwinkle, alt: "A garden filled with bright pink periwinkle flowers" },
  { src: arecaPalm, alt: "A young areca palm ready for a new home" },
];

export const categoryTiles = [
  {
    name: "Indoor Plants",
    note: "Make every room breathe",
    image: dieffenbachia,
    to: "/indoor-plants",
  },
  {
    name: "Outdoor Plants",
    note: "Grown for sun and breeze",
    image: jasmine,
    to: "/outdoor-plants",
  },
  {
    name: "Indoor & Outdoor",
    note: "Happy in either space",
    image: croton,
    to: "/shop",
    search: { category: "both" },
  },
  { name: "Seeds", note: "Grow from the very start", image: periwinkle, to: "/seeds" },
  { name: "Pots & Care", note: "Everything they need", image: desertRose, to: "/pots-care" },
] as const;
