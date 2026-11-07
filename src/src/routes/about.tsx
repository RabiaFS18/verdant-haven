import { createFileRoute } from "@tanstack/react-router";
import { Leaf, PackageCheck, ShieldCheck, Sprout } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { communityPhotos } from "@/data/products";
import { SITE } from "@/data/site";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: "About Us",
      description:
        "Verdant Haven is a plant nursery curating ethically grown plants, artisan pots, and expert care for modern homes.",
    }),
  component: AboutPage,
});

const values = [
  {
    icon: Sprout,
    title: "Ethically grown",
    text: "We partner with small, trusted growers who propagate responsibly, never wild-harvested.",
  },
  {
    icon: PackageCheck,
    title: "Thoughtfully packed",
    text: "Every plant travels in recyclable, cushioned packaging designed with our growers.",
  },
  {
    icon: ShieldCheck,
    title: "30-day guarantee",
    text: "If your plant doesn’t settle in happily, we replace it or refund you, no fuss.",
  },
  {
    icon: Leaf,
    title: "Care for life",
    text: "Free expert advice for the life of your plant, whenever you need it.",
  },
];

function AboutPage() {
  return (
    <section className="container-page py-14 lg:py-20">
      <PageHeader eyebrow="Our story" title="We believe every home deserves a little wild.">
        <p className="text-lg leading-relaxed">
          Verdant Haven began in a small greenhouse with a simple idea: premium plants, honestly
          grown and thoughtfully delivered. Today we curate indoor and outdoor collections, artisan
          pots, and organic care essentials, and we help every plant parent grow with confidence.
        </p>
      </PageHeader>

      <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {communityPhotos.map((photo) => (
          <div key={photo.alt} className="aspect-square overflow-hidden rounded-md bg-muted">
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>

      <div id="guarantee" className="mt-16 grid scroll-mt-28 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value) => (
          <div key={value.title} className="rounded-md border border-border bg-card p-6">
            <value.icon className="size-6 text-terracotta" aria-hidden="true" />
            <h2 className="mt-4 text-xl">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
          </div>
        ))}
      </div>

      <div id="contact" className="mt-16 scroll-mt-28 rounded-md bg-soft-sage p-8 sm:p-12">
        <h2 className="text-3xl">Visit or write to us</h2>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Questions about an order, a plant, or a partnership? We reply within one business day.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
            {SITE.email}
          </a>
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            WhatsApp: {SITE.phone}
          </a>
          <span className="text-muted-foreground font-normal">{SITE.hours}</span>
        </div>
      </div>
    </section>
  );
}
