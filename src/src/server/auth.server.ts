import { getRequest } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Checkout works for guests and signed-in customers alike.
 * If a valid bearer token is attached we link the order to that account;
 * an invalid or missing token simply means "guest".
 */
export async function getOptionalUserId(): Promise<string | null> {
  const header = getRequest()?.headers.get("authorization") ?? "";
  const token = /^Bearer (\S+)$/.exec(header)?.[1];
  if (!token || token.split(".").length !== 3) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : (data.user?.id ?? null);
}
