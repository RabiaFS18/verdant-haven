import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Leaf } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE } from "@/data/site";
import { whoAmIFn } from "@/lib/admin.functions";
import { isBackendConfigured, useAuth } from "@/lib/auth";

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh place-items-center bg-muted/40 p-5">
      <div className="w-full max-w-md rounded-md border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold leading-none">{SITE.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Admin panel</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn’t sign in. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Centered>
      <h1 className="text-2xl">Sign in</h1>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-5 text-xs text-muted-foreground">
        No account yet? Create one with the account button on the shop first, then come back here.
      </p>
    </Centered>
  );
}

function NoAccess({ userId, email }: { userId: string; email: string | undefined }) {
  const [copied, setCopied] = useState(false);
  const sql = `insert into public.admin_users (user_id) values ('${userId}');`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed, please select the text and copy it.");
    }
  };

  return (
    <Centered>
      <h1 className="text-2xl">This account isn’t an admin yet</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        You’re signed in as <strong className="text-foreground">{email}</strong>. To make this
        account the shop admin, run the line below once in your Supabase project (SQL editor), then
        refresh this page.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-xs">{sql}</pre>
      <Button variant="outline" size="sm" className="mt-3" onClick={copy}>
        {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
      </Button>
      <div className="mt-6">
        <SignOutLink />
      </div>
    </Centered>
  );
}

export function SignOutLink() {
  const out = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
  };
  return (
    <button onClick={out} className="block text-sm text-muted-foreground underline">
      Sign out
    </button>
  );
}

/** Shows the sign-in form, or an explanation, until the visitor is a verified admin. */
export function AdminGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const me = useQuery({
    queryKey: ["admin", "me", user?.id],
    queryFn: () => whoAmIFn(),
    enabled: ready && Boolean(user),
    retry: false,
  });

  if (!isBackendConfigured) {
    return (
      <Centered>
        <h1 className="text-2xl">Backend not connected</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Add your Supabase values to <code>.env</code> (see <code>.env.example</code>) and restart
          the app to use the admin panel.
        </p>
      </Centered>
    );
  }
  if (!ready || (user && me.isPending)) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      </Centered>
    );
  }
  if (!user) return <SignIn />;
  if (me.isError) {
    return (
      <Centered>
        <h1 className="text-2xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {me.error instanceof Error ? me.error.message : "Couldn’t check your access."}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => void me.refetch()}>
          Try again
        </Button>
      </Centered>
    );
  }
  if (!me.data?.isAdmin) return <NoAccess userId={user.id} email={user.email} />;
  return <>{children}</>;
}
