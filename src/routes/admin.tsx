import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ExternalLink, Leaf } from "lucide-react";

import { AdminGate, SignOutLink } from "@/components/admin/admin-gate";
import { SITE } from "@/data/site";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: `Admin — ${SITE.name}` }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/orders", label: "Orders", exact: false },
  { to: "/admin/products", label: "Products", exact: false },
] as const;

function AdminLayout() {
  return (
    <AdminGate>
      <div className="min-h-svh bg-muted/40">
        <header className="sticky top-0 z-30 border-b bg-background">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="size-4" />
              </span>
              <span className="hidden font-display text-lg font-semibold sm:inline">
                {SITE.name} Admin
              </span>
            </Link>
            <nav
              aria-label="Admin"
              className="flex flex-1 gap-1 overflow-x-auto text-sm font-medium"
            >
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeOptions={{ exact: link.exact }}
                  className="whitespace-nowrap rounded-md px-3 py-2 hover:bg-muted"
                  activeProps={{
                    className:
                      "whitespace-nowrap rounded-md bg-primary px-3 py-2 text-primary-foreground",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex"
            >
              View shop <ExternalLink className="size-3.5" />
            </a>
            <div className="text-sm">
              <SignOutLink />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </AdminGate>
  );
}
