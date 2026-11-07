import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Scissors, Sun, Thermometer } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";
import { useUi } from "@/lib/ui";

export const Route = createFileRoute("/plant-care-guide")({
  head: () =>
    pageHead({
      title: "Plant Care Guide",
      description:
        "Simple, expert-backed plant care: light, watering, feeding, and troubleshooting for happy houseplants.",
    }),
  component: CareGuidePage,
});

const guides = [
  {
    icon: Sun,
    title: "Light",
    text: "Most houseplants love bright, indirect light. South-facing windows suit sun-lovers like croton and desert rose; spider plants tolerate lower light. Rotate pots weekly for even growth.",
  },
  {
    icon: Droplets,
    title: "Watering",
    text: "Water when the top inch of soil feels dry. Overwatering is the #1 plant killer, so always let excess drain. Succulents and desert rose prefer a full dry-out between waterings.",
  },
  {
    icon: Thermometer,
    title: "Temperature & humidity",
    text: "Keep plants between 18–27°C and away from drafts and heaters. Tropical plants like dieffenbachia and areca palm appreciate a weekly misting or a pebble tray.",
  },
  {
    icon: Scissors,
    title: "Feeding & pruning",
    text: "Feed monthly in spring and summer with a diluted organic fertilizer. Snip yellow leaves at the base and wipe dust from foliage so plants can breathe and photosynthesize.",
  },
];

const faqs = [
  {
    q: "Why are my plant’s leaves turning yellow?",
    a: "Usually overwatering. Let the soil dry out, check drainage, and trim affected leaves.",
  },
  {
    q: "How often should I repot?",
    a: "Every 12–18 months, or when roots circle the pot. Go one size up and refresh the soil.",
  },
  {
    q: "Are your plants pet-safe?",
    a: "Spider plants, areca palms and Arabian jasmine are pet-friendly. Every product page says whether a plant is safe around pets.",
  },
  {
    q: "What if my plant arrives damaged?",
    a: "Every order is covered by our 30-day guarantee. Send us a photo and we’ll replace or refund.",
  },
];

function CareGuidePage() {
  const { open } = useUi();

  return (
    <section className="container-page py-14 lg:py-20">
      <PageHeader eyebrow="Grow with confidence" title="Plant care guide">
        <p>Simple, expert-backed habits that keep your plants lush. No green thumb required.</p>
      </PageHeader>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <div key={guide.title} className="rounded-md border border-border bg-card p-6">
            <guide.icon className="size-6 text-terracotta" aria-hidden="true" />
            <h2 className="mt-4 text-2xl">{guide.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{guide.text}</p>
          </div>
        ))}
      </div>

      <h2 id="faq" className="mt-16 scroll-mt-28 text-3xl sm:text-4xl">
        Common questions
      </h2>
      <Accordion type="single" collapsible className="mt-6 max-w-3xl">
        {faqs.map((faq) => (
          <AccordionItem key={faq.q} value={faq.q}>
            <AccordionTrigger className="text-left font-semibold">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-16 rounded-md bg-primary p-8 text-primary-foreground sm:p-12">
        <h2 className="max-w-xl text-3xl sm:text-4xl">
          Still not sure which plant fits your space?
        </h2>
        <p className="mt-3 max-w-lg text-primary-foreground/80">
          Take our 30-second quiz and we’ll match you with a plant that thrives in your home.
        </p>
        <Button size="lg" variant="accent" className="mt-6 h-12" onClick={() => open("quiz")}>
          Take the Plant Match quiz
        </Button>
      </div>
    </section>
  );
}
