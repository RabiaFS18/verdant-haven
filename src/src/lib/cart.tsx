import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import { getProduct, type Product } from "@/data/products";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, MAX_QTY_PER_ITEM } from "@/data/site";

const STORAGE_KEY = "vh-store-v1";

type State = {
  quantities: Record<string, number>;
  wishlist: string[];
  hydrated: boolean;
};

type Action =
  | { type: "hydrate"; quantities: Record<string, number>; wishlist: string[] }
  | { type: "add"; slug: string; quantity: number }
  | { type: "setQuantity"; slug: string; quantity: number }
  | { type: "clear" }
  | { type: "toggleWishlist"; slug: string };

const maxFor = (slug: string) => Math.min(MAX_QTY_PER_ITEM, getProduct(slug)?.stock ?? 0);

function clamp(slug: string, quantity: number) {
  return Math.max(0, Math.min(maxFor(slug), Math.floor(quantity)));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { quantities: action.quantities, wishlist: action.wishlist, hydrated: true };
    case "add": {
      const next = clamp(action.slug, (state.quantities[action.slug] ?? 0) + action.quantity);
      return { ...state, quantities: { ...state.quantities, [action.slug]: next } };
    }
    case "setQuantity": {
      const quantities = { ...state.quantities };
      const next = clamp(action.slug, action.quantity);
      if (next === 0) delete quantities[action.slug];
      else quantities[action.slug] = next;
      return { ...state, quantities };
    }
    case "clear":
      return { ...state, quantities: {} };
    case "toggleWishlist":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.slug)
          ? state.wishlist.filter((s) => s !== action.slug)
          : [...state.wishlist, action.slug],
      };
  }
}

/** Reads saved state defensively: unknown products and bad quantities are dropped. */
function readStorage(): Pick<State, "quantities" | "wishlist"> {
  const empty = { quantities: {}, wishlist: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw) as { quantities?: unknown; wishlist?: unknown };

    const quantities: Record<string, number> = {};
    if (data.quantities && typeof data.quantities === "object") {
      for (const [slug, value] of Object.entries(data.quantities)) {
        const quantity = typeof value === "number" ? clamp(slug, value) : 0;
        if (getProduct(slug) && quantity > 0) quantities[slug] = quantity;
      }
    }
    const wishlist = Array.isArray(data.wishlist)
      ? data.wishlist.filter((s): s is string => typeof s === "string" && !!getProduct(s))
      : [];
    return { quantities, wishlist };
  } catch {
    return empty;
  }
}

export type CartLine = { product: Product; quantity: number; lineTotal: number };

type CartContextValue = {
  /** False on the server and during the first client render, so SSR markup matches. */
  hydrated: boolean;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  delivery: number;
  total: number;
  amountToFreeDelivery: number;
  wishlist: Product[];
  isWishlisted: (slug: string) => boolean;
  quantityOf: (slug: string) => number;
  addToCart: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  catalogVersion = "",
}: {
  children: ReactNode;
  /** Changes whenever live prices or stock change, so totals stay correct. */
  catalogVersion?: string;
}) {
  const [state, dispatch] = useReducer(reducer, { quantities: {}, wishlist: [], hydrated: false });

  useEffect(() => {
    const load = () => dispatch({ type: "hydrate", ...readStorage() });
    load();
    // Keep several open tabs in step with each other.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ quantities: state.quantities, wishlist: state.wishlist }),
      );
    } catch {
      // Storage can be full or blocked (private mode); the cart still works for this visit.
    }
  }, [state]);

  const addToCart = useCallback(
    (slug: string, quantity = 1) => dispatch({ type: "add", slug, quantity }),
    [],
  );
  const setQuantity = useCallback(
    (slug: string, quantity: number) => dispatch({ type: "setQuantity", slug, quantity }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: "clear" }), []);
  const toggleWishlist = useCallback(
    (slug: string) => dispatch({ type: "toggleWishlist", slug }),
    [],
  );

  const value = useMemo<CartContextValue>(() => {
    const lines: CartLine[] = [];
    for (const [slug, quantity] of Object.entries(state.quantities)) {
      const product = getProduct(slug);
      if (product) lines.push({ product, quantity, lineTotal: product.price * quantity });
    }
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const wishlist = state.wishlist.flatMap((slug) => getProduct(slug) ?? []);

    return {
      hydrated: state.hydrated,
      lines,
      itemCount,
      subtotal,
      delivery,
      total: subtotal + delivery,
      amountToFreeDelivery: subtotal > 0 ? Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal) : 0,
      wishlist,
      isWishlisted: (slug) => state.wishlist.includes(slug),
      quantityOf: (slug) => state.quantities[slug] ?? 0,
      addToCart,
      setQuantity,
      clearCart,
      toggleWishlist,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, catalogVersion, addToCart, setQuantity, clearCart, toggleWishlist]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
