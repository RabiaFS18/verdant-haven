import { useEffect } from "react";

import { useUi } from "@/lib/ui";

import { AccountDialog } from "./account-dialog";
import { CartDrawer } from "./cart-drawer";
import { MobileMenu } from "./mobile-menu";
import { QuizDialog } from "./quiz-dialog";
import { SearchDialog } from "./search-dialog";
import { WishlistDrawer } from "./wishlist-drawer";

/** Every slide-over and dialog lives here, mounted once for the whole site. */
export function Overlays() {
  const { open } = useUi();

  // Ctrl/⌘ + K opens search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open("search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <CartDrawer />
      <WishlistDrawer />
      <SearchDialog />
      <QuizDialog />
      <AccountDialog />
      <MobileMenu />
    </>
  );
}
