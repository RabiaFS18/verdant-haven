import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsletterSchema } from "@/lib/checkout-schema";
import { subscribeNewsletterFn } from "@/lib/shop.functions";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const subscribe = useMutation({
    mutationFn: (address: string) => subscribeNewsletterFn({ data: { email: address } }),
    onSuccess: () => setEmail(""),
    onError: (e) => setError(e instanceof Error ? e.message : "Something went wrong. Try again."),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    subscribe.mutate(parsed.data.email);
  };

  if (subscribe.isSuccess) {
    return (
      <p role="status" className="mt-7 max-w-lg text-footer-foreground">
        You’re on the list. Your first-order code and care tips are on their way.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-7 max-w-lg">
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          autoComplete="email"
          className="h-11 border-footer-foreground/30 text-footer-foreground placeholder:text-footer-foreground/60"
        />
        <Button type="submit" variant="accent" className="h-11" disabled={subscribe.isPending}>
          {subscribe.isPending ? "Joining…" : "Join us"}
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 text-sm text-footer-foreground">
          {error}
        </p>
      )}
    </form>
  );
}
