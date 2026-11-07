import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

/** False when the .env file has no Supabase values (the shop still browses fine without them). */
export const isBackendConfigured = Boolean(
  import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isBackendConfigured);

  useEffect(() => {
    if (!isBackendConfigured) return;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, ready };
}
