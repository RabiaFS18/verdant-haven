import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { updateOrderFn } from "@/lib/admin.functions";
import {
  formatDateTime,
  orderMessage,
  STATUS_LABEL,
  STATUS_STYLE,
  whatsappUrl,
  type OrderStatus,
} from "@/lib/admin-utils";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AdminOrder = {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string;
  city: string;
  postal_code: string;
  notes: string;
  admin_notes: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
  order_items: { id: string; name: string; unit_price: number; quantity: number }[];
};

type Step = {
  label: string;
  status: OrderStatus;
  paymentStatus?: "paid";
  variant?: "accent" | "default";
};

/** The one sensible next action for each stage of a cash-on-delivery order. */
const NEXT_STEP: Partial<Record<OrderStatus, Step>> = {
  processing: { label: "Confirm order", status: "confirmed", variant: "accent" },
  confirmed: { label: "Mark as shipped", status: "shipped", variant: "accent" },
  shipped: {
    label: "Delivered, cash received",
    status: "delivered",
    paymentStatus: "paid",
    variant: "accent",
  },
};

export function OrderSheet({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(order?.admin_notes ?? "");
  }, [order?.id, order?.admin_notes]);

  const update = useMutation({
    mutationFn: (input: { status: OrderStatus; paymentStatus?: "paid"; adminNotes?: string }) =>
      updateOrderFn({
        data: {
          id: order!.id,
          status: input.status,
          ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
          ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
        },
      }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(
        variables.adminNotes !== undefined && variables.status === order?.status
          ? "Note saved"
          : `Order marked ${STATUS_LABEL[variables.status].toLowerCase()}`,
      );
      if (variables.status === "cancelled") onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn’t update the order."),
  });

  if (!order) return <Sheet open={false} onOpenChange={onClose} />;

  const status = order.status as OrderStatus;
  const next = NEXT_STEP[status];
  const wa = whatsappUrl(
    order.phone,
    orderMessage(order.full_name, order.order_number, Number(order.total)),
  );
  const busy = update.isPending;

  const cancel = () => {
    if (
      window.confirm(
        "Cancel this order? The items go back into stock. A cancelled order can’t be reopened.",
      )
    ) {
      update.mutate({ status: "cancelled" });
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">{order.order_number}</SheetTitle>
          <SheetDescription>{formatDateTime(order.created_at)}</SheetDescription>
          <div className="flex gap-2 pt-1">
            <Badge className={cn("border-0", STATUS_STYLE[status])}>
              {STATUS_LABEL[status] ?? status}
            </Badge>
            <Badge variant="outline">
              Cash on delivery · {order.payment_status === "paid" ? "paid" : order.payment_status}
            </Badge>
          </div>
        </SheetHeader>

        <section className="mt-6 grid gap-2 text-sm">
          <h3 className="font-display text-lg">Customer</h3>
          <p className="font-semibold">{order.full_name}</p>
          {order.phone && (
            <a href={`tel:${order.phone}`} className="flex items-center gap-2 hover:underline">
              <Phone className="size-4 text-muted-foreground" /> {order.phone}
            </a>
          )}
          <p className="text-muted-foreground">{order.email}</p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              {order.address}, {order.city}
              {order.postal_code ? ` ${order.postal_code}` : ""}
            </span>
          </p>
          {order.notes && (
            <p className="rounded-md bg-muted p-3">
              <span className="font-semibold">Delivery note: </span>
              {order.notes}
            </p>
          )}
          {wa && (
            <Button asChild variant="outline" size="sm" className="w-fit">
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle /> Message on WhatsApp
              </a>
            </Button>
          )}
        </section>

        <section className="mt-6">
          <h3 className="font-display text-lg">Items</h3>
          <ul className="mt-2 divide-y text-sm">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-2">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>{formatRs(Number(item.unit_price) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatRs(Number(order.subtotal))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{Number(order.shipping) === 0 ? "Free" : formatRs(Number(order.shipping))}</dd>
            </div>
            <div className="flex justify-between font-display text-xl">
              <dt>Collect</dt>
              <dd>{formatRs(Number(order.total))}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 grid gap-2">
          <h3 className="font-display text-lg">Update</h3>
          {next && (
            <Button
              variant={next.variant ?? "default"}
              className="h-11"
              disabled={busy}
              onClick={() =>
                update.mutate({
                  status: next.status,
                  ...(next.paymentStatus ? { paymentStatus: next.paymentStatus } : {}),
                })
              }
            >
              {next.label}
            </Button>
          )}
          {status === "delivered" && order.payment_status !== "paid" && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => update.mutate({ status: "delivered", paymentStatus: "paid" })}
            >
              Mark cash as received
            </Button>
          )}
          {status !== "cancelled" && status !== "delivered" && (
            <Button variant="outline" className="text-destructive" disabled={busy} onClick={cancel}>
              Cancel order
            </Button>
          )}
          {status === "cancelled" && (
            <p className="text-sm text-muted-foreground">
              This order is cancelled and its stock has been returned.
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-2 pb-6">
          <Label htmlFor="admin-notes">Private notes (customers never see these)</Label>
          <Textarea
            id="admin-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Rider name, call attempts, special handling…"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={busy || notes === order.admin_notes}
            onClick={() => update.mutate({ status, adminNotes: notes })}
          >
            Save note
          </Button>
        </section>
      </SheetContent>
    </Sheet>
  );
}
