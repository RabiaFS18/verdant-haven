import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { ProductImage } from "@/components/shop/product-image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { customerSchema, type CustomerInput } from "@/lib/checkout-schema";
import { formatRs } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { placeOrderFn } from "@/lib/shop.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    ...pageHead({
      title: "Checkout",
      description: "Review your order and confirm delivery details.",
    }),
    meta: [
      ...pageHead({
        title: "Checkout",
        description: "Review your order and confirm delivery details.",
      }).meta,
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { hydrated, lines, subtotal, delivery, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = Route.useNavigate();

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      notes: "",
    },
  });

  // Prefill the email for signed-in customers without overwriting anything already typed.
  useEffect(() => {
    if (user?.email && !form.getValues("email")) form.setValue("email", user.email);
  }, [user, form]);

  const order = useMutation({
    mutationFn: (customer: CustomerInput) =>
      placeOrderFn({
        data: {
          customer,
          items: lines.map((l) => ({ slug: l.product.slug, quantity: l.quantity })),
        },
      }),
    onSuccess: ({ orderNumber }) => {
      void navigate({ to: "/order-confirmed", search: { order: orderNumber } });
      clearCart();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "We couldn’t place your order. Try again.",
      ),
  });

  if (!hydrated || order.isSuccess) {
    return (
      <section className="container-page py-20">
        <p className="text-muted-foreground" role="status">
          Loading your cart…
        </p>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="container-page py-24 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Add a plant or two and come back to check out.</p>
        <Button asChild className="mt-6">
          <Link to="/shop">Browse the collection</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="container-page py-14 lg:py-20">
      <PageHeader eyebrow="Almost there" title="Checkout" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-16">
        <Form {...form}>
          <form
            id="checkout-form"
            onSubmit={form.handleSubmit((values) => order.mutate(values))}
            noValidate
            className="grid gap-5"
          >
            <h2 className="text-2xl">Delivery details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="0300 1234567"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street address</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="street-address"
                      placeholder="House, street, area"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-level2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal code (optional)</FormLabel>
                    <FormControl>
                      <Input autoComplete="postal-code" inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormDescription>
                    Landmarks, gate instructions, best time to call.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-3 rounded-md border bg-soft-sage p-4">
              <Banknote className="mt-0.5 size-5 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">Cash on delivery</p>
                <p className="text-sm text-muted-foreground">
                  Pay in cash when your plants arrive. Nothing is charged online.
                </p>
              </div>
            </div>
          </form>
        </Form>

        <aside
          aria-labelledby="summary"
          className="h-fit rounded-md border bg-card p-6 lg:sticky lg:top-28"
        >
          <h2 id="summary" className="text-2xl">
            Order summary
          </h2>
          <ul className="mt-5 divide-y">
            {lines.map(({ product, quantity, lineTotal }) => (
              <li key={product.slug} className="flex gap-3 py-3">
                <ProductImage
                  product={product}
                  decorative
                  className="size-14 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatRs(lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatRs(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{delivery === 0 ? "Free" : formatRs(delivery)}</dd>
            </div>
            <div className="flex justify-between pt-2 font-display text-xl">
              <dt>Total</dt>
              <dd>{formatRs(total)}</dd>
            </div>
          </dl>
          <Button
            type="submit"
            form="checkout-form"
            variant="accent"
            className="mt-5 h-12 w-full"
            disabled={order.isPending}
          >
            {order.isPending ? "Placing your order…" : `Place order · ${formatRs(total)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            The final total is confirmed by our system when you place the order.
          </p>
        </aside>
      </div>
    </section>
  );
}
