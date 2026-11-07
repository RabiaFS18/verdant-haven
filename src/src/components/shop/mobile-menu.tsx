import { Link } from "@tanstack/react-router";
import { CircleUserRound, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { navLinks } from "@/data/site";
import { useUi } from "@/lib/ui";

export function MobileMenu() {
  const { bind, open, close } = useUi();

  return (
    <Sheet {...bind("menu")}>
      <SheetContent side="left" className="w-full">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Verdant Haven</SheetTitle>
          <SheetDescription>Grow something beautiful.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="mt-8 grid">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={close}
              className="border-b py-4 font-display text-2xl"
              activeProps={{ className: "border-b py-4 font-display text-2xl text-terracotta" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 grid gap-2">
          <Button variant="outline" onClick={() => open("wishlist")}>
            <Heart /> Wishlist
          </Button>
          <Button variant="outline" onClick={() => open("account")}>
            <CircleUserRound /> My account
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
