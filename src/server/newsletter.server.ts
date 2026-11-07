import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FRIENDLY = "We couldn’t sign you up right now. Please try again shortly.";

export async function subscribe(email: string) {
  try {
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert({ email: email.toLowerCase() }, { onConflict: "email", ignoreDuplicates: true });
    if (error) throw error;
  } catch (error) {
    console.error("[newsletter] subscribe failed", error);
    throw new Error(FRIENDLY);
  }
}
