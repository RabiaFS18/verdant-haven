import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { testimonials } from "@/data/site";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const current = testimonials[index] ?? testimonials[0];
  const count = testimonials.length;

  return (
    <figure>
      <div className="flex gap-1 text-terracotta" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-current" />
        ))}
      </div>
      <blockquote className="mt-6 font-display text-3xl leading-snug sm:text-4xl">
        “{current.quote}”
      </blockquote>
      <figcaption className="mt-6 text-sm font-semibold">
        {current.author}{" "}
        <span className="ml-2 font-normal text-muted-foreground">{current.note}</span>
      </figcaption>

      {count > 1 && (
        <div className="mt-7 flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setIndex((index + count - 1) % count)}
            aria-label="Previous review"
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setIndex((index + 1) % count)}
            aria-label="Next review"
          >
            <ChevronRight />
          </Button>
          <span className="pl-2 text-xs text-muted-foreground" aria-live="polite">
            {index + 1} / {count}
          </span>
        </div>
      )}
    </figure>
  );
}
