import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BellRing, PackageCheck, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardFn } from "@/lib/admin.functions";
import { formatDateTime, STATUS_LABEL, STATUS_STYLE, type OrderStatus } from "@/lib/admin-utils";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DashboardPage() {
  // Refreshes every 30 seconds so new orders show up while the page stays open.
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => dashboardFn(),
    refetchInterval: 30_000,
  });

  if (isPending) return <p className="text-muted-foreground">Loading…</p>;
  if (isError) {
    return (
      <div>
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Couldn’t load."}
        </p>
        <Button variant="outline" className="mt-3" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const newOrders = data.byStatus["processing"] ?? 0;

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl">Dashboard</h1>

      {newOrders > 0 && (
        <Link
          to="/admin/orders"
          search={{ status: "processing" }}
          className="flex items-center gap-3 rounded-md bg-terracotta px-5 py-4 text-terracotta-foreground"
        >
          <BellRing className="size-5" aria-hidden="true" />
          <span className="font-semibold">
            {newOrders} new {newOrders === 1 ? "order is" : "orders are"} waiting for you
          </span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<PackageCheck className="size-4" />}
          label="Orders today"
          value={String(data.todayOrders)}
        />
        <Stat
          icon={<Wallet className="size-4" />}
          label="Sales today"
          value={formatRs(data.todayRevenue)}
          hint="Excludes cancelled orders"
        />
        <Stat
          icon={<PackageCheck className="size-4" />}
          label="All orders"
          value={String(data.totalOrders)}
          hint="Most recent 1,000"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border bg-card p-5">
          <h2 className="text-xl">Orders by status</h2>
          <ul className="mt-4 grid gap-2">
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((status) => (
              <li key={status}>
                <Link
                  to="/admin/orders"
                  search={{ status }}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
                >
                  <Badge className={cn("border-0", STATUS_STYLE[status])}>
                    {STATUS_LABEL[status]}
                  </Badge>
                  <span className="font-semibold">{data.byStatus[status] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border bg-card p-5">
          <h2 className="flex items-center gap-2 text-xl">
            <AlertTriangle className="size-5 text-terracotta" aria-hidden="true" /> Low stock
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Every visible product has more than 5 in stock.
            </p>
          ) : (
            <ul className="mt-4 grid gap-1">
              {data.lowStock.map((p) => (
                <li
                  key={p.slug}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                >
                  <span>{p.name}</span>
                  <span className={cn("font-semibold", p.stock === 0 && "text-destructive")}>
                    {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/admin/products">Manage stock</Link>
          </Button>
        </section>
      </div>

      <section className="rounded-md border bg-card p-5">
        <h2 className="text-xl">Latest orders</h2>
        {data.recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No orders yet. They’ll appear here as they arrive.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {data.recent.map((o) => (
              <li
                key={o.order_number}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{o.order_number}</p>
                  <p className="text-muted-foreground">
                    {o.full_name} · {formatDateTime(o.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={cn("border-0", STATUS_STYLE[o.status as OrderStatus])}>
                    {STATUS_LABEL[o.status as OrderStatus] ?? o.status}
                  </Badge>
                  <span className="font-semibold">{formatRs(Number(o.total))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/admin/orders">See all orders</Link>
        </Button>
      </section>
    </div>
  );
}
