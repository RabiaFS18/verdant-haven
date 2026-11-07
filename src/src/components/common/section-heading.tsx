import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  action?: string;
};

/** Heading for homepage sections; the optional action always goes to the full shop. */
export function SectionHeading({ eyebrow, title, action }: SectionHeadingProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-4xl sm:text-5xl">{title}</h2>
      </div>
      {action && (
        <Link
          to="/shop"
          className="hidden items-center gap-2 border-b border-foreground pb-1 text-sm font-semibold sm:flex"
        >
          {action} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
