import { Link } from "@tanstack/react-router";
import { CircleUserRound, Heart, Leaf, Menu, Search, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FREE_DELIVERY_THRESHOLD, navLinks } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatRs } from "@/lib/format";
import { useUi } from "@/lib/ui";

import { ThemeToggle } from "./theme-toggle";

function CountBadge({ value }: { value: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-terracotta text-[10px] font-bold text-terracotta-foreground"
    >
      {value}
    </span>
  );
}

export function Header() {
  const { itemCount, wishlist } = useCart();
  const { open } = useUi();

  return (
    <>
      <div className="bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground">
        Free delivery on orders over {formatRs(FREE_DELIVERY_THRESHOLD)}
        <span className="mx-2 opacity-60" aria-hidden="true">
          ·
        </span>
        Cash on delivery across Pakistan
      </div>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="container-page grid h-18 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={() => open("menu")}
            aria-label="Open menu"
          >
            <Menu />
          </Button>

          <Link to="/" className="flex items-center gap-2.5 xl:justify-self-start">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold sm:text-2xl">Verdant Haven</span>
          </Link>

          <nav
            aria-label="Main"
            className="hidden items-center justify-center gap-6 text-sm font-medium xl:flex"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="nav-link"
                activeProps={{ className: "nav-link text-terracotta" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center justify-end">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => open("search")}
              aria-label="Search plants"
            >
              <Search />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden sm:inline-flex"
              onClick={() => open("wishlist")}
              aria-label={`Wishlist, ${wishlist.length} items`}
            >
              <Heart />
              {wishlist.length > 0 && <CountBadge value={wishlist.length} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => open("cart")}
              aria-label={`Cart, ${itemCount} items`}
            >
              <ShoppingBag />
              {itemCount > 0 && <CountBadge value={itemCount} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => open("account")}
              aria-label="Account"
            >
              <CircleUserRound />
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
