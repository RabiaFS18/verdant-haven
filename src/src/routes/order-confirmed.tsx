import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SITE } from "@/data/site";
import { pageHead } from "@/lib/seo";

const ORDER_NUMBER = /^VH-\d{6}-[A-Z0-9]{5}$/;

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: (search: Record<string, unknown>): { order?: string } => {
    const order = search["order"];
    return typeof order === "string" && ORDER_NUMBER.test(order) ? { order } : {};
  },
  head: () => {
    const base = pageHead({
      title: "Order placed",
      description: "Your Verdant Haven order is confirmed.",
    });
    return { meta: [...base.meta, { name: "robots", content: "noindex" }] };
  },
  component: OrderConfirmedPage,
});

function OrderConfirmedPage() {
  const { order } = Route.useSearch();

  return (
    <section className="container-page py-20 text-center lg:py-28">
      <CircleCheck className="mx-auto size-14 text-primary" aria-hidden="true" />
      <h1 className="mt-6 text-4xl sm:text-5xl">Thank you, your order is placed</h1>
      {order && (
        <p className="mt-4 text-lg">
          Order number <strong className="font-semibold">{order}</strong>
        </p>
      )}
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        Keep this number for any questions about your order, and have cash ready for when your
        plants arrive. Write to{" "}
        <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
          {SITE.email}
        </a>{" "}
        if anything needs changing.
      </p>
      <Button asChild className="mt-8">
        <Link to="/shop">Keep shopping</Link>
      </Button>
    </section>
  );
}
