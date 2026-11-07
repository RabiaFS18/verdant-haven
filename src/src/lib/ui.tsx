import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Panel = "cart" | "wishlist" | "search" | "quiz" | "account" | "menu";

type UiContextValue = {
  panel: Panel | null;
  open: (panel: Panel) => void;
  close: () => void;
  /** Adapter for Radix `open` / `onOpenChange` props. */
  bind: (panel: Panel) => { open: boolean; onOpenChange: (open: boolean) => void };
};

const UiContext = createContext<UiContextValue | null>(null);

/** Only one overlay (cart, search, quiz…) can be open at a time. */
export function UiProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const open = useCallback((next: Panel) => setPanel(next), []);
  const close = useCallback(() => setPanel(null), []);

  const value = useMemo<UiContextValue>(
    () => ({
      panel,
      open,
      close,
      bind: (target) => ({
        open: panel === target,
        onOpenChange: (isOpen) => setPanel(isOpen ? target : null),
      }),
    }),
    [panel, open, close],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside <UiProvider>");
  return ctx;
}
