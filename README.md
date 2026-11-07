# Verdant Haven

Online plant shop for Pakistan: browse, wishlist, cart, and cash-on-delivery checkout.
Built with TanStack Start (React 19, SSR), Tailwind CSS 4, shadcn/ui and Supabase.

## Quick start

```sh
npm install
cp .env.example .env     # fill in your Supabase values
npm run dev              # http://localhost:8080
```

Needs Node 22.18 or newer. Without `.env` the shop still browses; checkout, the newsletter form and
accounts need the backend.

| Command                             | What it does                                                    |
| ----------------------------------- | --------------------------------------------------------------- |
| `npm run dev` / `build` / `preview` | Develop, build and preview                                      |
| `npm run typecheck`                 | TypeScript in strict mode                                       |
| `npm run lint` / `format`           | ESLint and Prettier                                             |
| `npm run catalog:sql`               | Regenerate `supabase/sync-catalog.sql` from the product catalog |

## How it fits together

```
src/
  data/
    catalog.ts          Product catalog: the single source of truth (prices, stock, care data)
    products.ts         Adds images and helpers (best sellers, related, by category)
    site.ts             Delivery rules, navigation, testimonials, contact details
  lib/
    cart.tsx            Cart + wishlist (reducer, saved to localStorage, validated on load)
    ui.tsx              Which overlay is open (cart, search, quiz, account, menu)
    quiz.ts             Plant Match scoring
    checkout-schema.ts  Zod schemas shared by the browser form and the server
    shop.functions.ts   Server functions called from the browser (place order, newsletter)
    seo.ts              Titles and social tags for every page
  server/               Server-only code (never bundled for the browser)
    orders.server.ts    Calls the place_order database function, maps errors to plain language
    newsletter.server.ts
    auth.server.ts      Links an order to the signed-in customer when there is one
  components/
    layout/             Header, footer, theme toggle
    shop/               Product card, cart, wishlist, search, quiz, account, overlays
    common/             Page and section headings
    ui/                 shadcn/ui primitives (only the ones in use)
  routes/               One file per page (file-based routing)
drizzle/migrations/     SQL schema; 0001 adds PKR catalog, constraints and atomic checkout
scripts/                generate-catalog-sql.ts
```

### Why the backend is built this way

- **Prices never come from the browser.** Checkout sends product slugs and quantities. The
  `place_order` database function looks up prices, checks and decrements stock under row locks, and writes
  the order and its items in one transaction. Only the server's service role can call it.
- **One catalog.** `src/data/catalog.ts` feeds both the website and the database seed. After changing a
  price or description run `npm run catalog:sql` and apply `supabase/sync-catalog.sql`. It never
  overwrites live stock.
- **Delivery rules live in one place** (`src/data/site.ts`) and are passed to the database with each order.

## Setting up the database

1. Apply `drizzle/migrations/0000_*.sql` then `0001_*.sql` to your Supabase project
   (Lovable Cloud does this for you).
2. Put `SUPABASE_SERVICE_ROLE_KEY` in the server environment. Keep it out of any `VITE_` variable.
3. Update `src/integrations/supabase/types.ts` if your tooling regenerates it. It already includes
   `place_order` and the new `orders.notes` column.

Migration 0001 deletes the old US-dollar demo products. If you have real orders, review it first.

## Admin panel

Open `/admin` on your site (for example `http://localhost:8080/admin`).

- **Dashboard:** new orders waiting, today's orders and sales, low stock. Refreshes every 30 seconds.
- **Orders:** filter by status, search by name, phone or order number. Open an order to see the
  customer, items and what to collect, then move it along: Confirm, Shipped, Delivered with cash
  received. Cancelling puts the stock back. There is a one-tap WhatsApp message to the customer and
  a private notes box.
- **Products:** change price and stock, or hide a product without deleting it. Changes show on the
  shop straight away, and checkout always uses these live prices and stock.

### Making yourself the admin (once)

1. Apply migration `0002_admin_panel.sql`.
2. Create an account with the account button on the shop (or in the Supabase dashboard).
3. Open `/admin` and sign in. It shows a one-line SQL command containing your user id.
4. Run that line in the Supabase SQL editor, then refresh `/admin`.

Only accounts listed in `public.admin_users` can use the panel, and every admin action is checked on
the server, not just hidden in the browser.

If the backend is down the shop falls back to the built-in prices in `src/data/catalog.ts`.

## Before you launch

- Replace the pot, seed and bare-root product photos. Today they reuse cropped plant photos.
- Replace the sample testimonial in `src/data/site.ts` with real, permission-granted reviews.
- Check the care and pet-safety data in `catalog.ts` with your growers.
- Add real Privacy, Terms and shipping pages. The footer no longer links to pages that do not exist.
- Order confirmation emails and automatic alerts (email or WhatsApp) when a new order arrives are
  not built yet. For now, keep the admin dashboard open or check it regularly.
