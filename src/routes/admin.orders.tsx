import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { OrderSheet, type AdminOrder } from "@/components/admin/order-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listOrdersFn } from "@/lib/admin.functions";
import {
  formatDateTime,
  ORDER_STATUSES,
  STATUS_LABEL,
  STATUS_STYLE,
  type OrderStatus,
} from "@/lib/admin-utils";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";

type OrdersSearch = { status?: OrderStatus };

export const Route = createFileRoute("/admin/orders")({
  validateSearch: (search: Record<string, unknown>): OrdersSearch => {
    const status = search["status"];
    return ORDER_STATUSES.includes(status as OrderStatus) ? { status: status as OrderStatus } : {};
  },
  component: OrdersPage,
});

function OrdersPage() {
  const { status } = Route.useSearch();
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const id = setTimeout(() => setTerm(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text]);

  const orders = useQuery({
    queryKey: ["admin", "orders", status ?? "all", term],
    queryFn: () =>
      listOrdersFn({
        data: { ...(status ? { status } : {}), ...(term ? { search: term } : {}) },
      }),
    refetchInterval: 30_000,
  });

  const list = (orders.data ?? []) as AdminOrder[];
  const open = list.find((o) => o.id === openId) ?? null;

  return (
    <div className="grid gap-5">
      <h1 className="text-3xl">Orders</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter orders" className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant={status ? "outline" : "default"}>
            <Link to="/admin/orders" search={{}}>
              All
            </Link>
          </Button>
          {ORDER_STATUSES.map((s) => (
            <Button key={s} asChild size="sm" variant={status === s ? "default" : "outline"}>
              <Link to="/admin/orders" search={{ status: s }}>
                {STATUS_LABEL[s]}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="relative sm:w-72">
          <Search
            className="absolute left-3 top-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search name, phone, order no."
            aria-label="Search orders"
            className="h-10 pl-9"
          />
        </div>
      </div>

      {orders.isPending ? (
        <p className="text-muted-foreground">Loading orders…</p>
      ) : orders.isError ? (
        <div>
          <p className="text-destructive">
            {orders.error instanceof Error ? orders.error.message : "Couldn’t load orders."}
          </p>
          <Button variant="outline" className="mt-3" onClick={() => void orders.refetch()}>
            Try again
          </Button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-md border border-dashed bg-card p-10 text-center text-muted-foreground">
          {term || status
            ? "No orders match this filter."
            : "No orders yet. They’ll appear here as they arrive."}
        </div>
      ) : (
        <ul className="grid gap-2">
          {list.map((o) => {
            const s = o.status as OrderStatus;
            return (
              <li key={o.id}>
                <button
                  onClick={() => setOpenId(o.id)}
                  className="grid w-full gap-1 rounded-md border bg-card p-4 text-left transition-colors hover:border-primary sm:grid-cols-[1.1fr_1.3fr_auto_auto] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="font-semibold">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="text-sm">
                    <p>{o.full_name}</p>
                    <p className="text-muted-foreground">
                      {o.city} · {o.order_items.reduce((n, i) => n + i.quantity, 0)} items
                    </p>
                  </div>
                  <Badge className={cn("w-fit border-0", STATUS_STYLE[s])}>
                    {STATUS_LABEL[s] ?? o.status}
                  </Badge>
                  <p className="font-semibold sm:text-right">{formatRs(Number(o.total))}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <OrderSheet order={open} onClose={() => setOpenId(null)} />
    </div>
  );
}
