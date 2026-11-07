import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isBackendConfigured, useAuth } from "@/lib/auth";
import { useUi } from "@/lib/ui";

const emailField = z.string().trim().email("Enter a valid email address");
const passwordField = z.string().min(8, "Use at least 8 characters");

const signInSchema = z.object({ email: emailField, password: passwordField });
const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Enter your name"),
});

type Mode = "signin" | "signup";

async function authClient() {
  // Loaded lazily so the browser never touches Supabase until someone actually signs in.
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase.auth;
}

function AuthForm({ mode, onDone }: { mode: Mode; onDone: () => void }) {
  const [values, setValues] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = (mode === "signup" ? signUpSchema : signInSchema).safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const auth = await authClient();
      if (mode === "signin") {
        const { error } = await auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });
        if (error) throw error;
        toast.success("Welcome back");
        onDone();
      } else {
        const { data, error } = await auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: { data: { full_name: values.fullName.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created");
          onDone();
        } else {
          toast.success("Check your inbox to confirm your email, then sign in.");
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const field = (id: keyof typeof values, label: string, type: string, autoComplete: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`${mode}-${id}`}>{label}</Label>
      <Input
        id={`${mode}-${id}`}
        type={type}
        value={values[id]}
        onChange={set(id)}
        autoComplete={autoComplete}
        aria-invalid={errors[id] ? true : undefined}
        aria-describedby={errors[id] ? `${mode}-${id}-error` : undefined}
      />
      {errors[id] && (
        <p id={`${mode}-${id}-error`} role="alert" className="text-sm text-destructive">
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="mt-4 grid gap-4">
      {mode === "signup" && field("fullName", "Full name", "text", "name")}
      {field("email", "Email", "email", "email")}
      {field(
        "password",
        "Password",
        "password",
        mode === "signup" ? "new-password" : "current-password",
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}

export function AccountDialog() {
  const { bind, close } = useUi();
  const { user, ready } = useAuth();

  const signOut = async () => {
    const auth = await authClient();
    await auth.signOut();
    toast.success("Signed out");
    close();
  };

  return (
    <Dialog {...bind("account")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">
            {user ? "Your account" : "Welcome to the Haven"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? `Signed in as ${user.email}.`
              : "Sign in to link orders to your account and check out faster."}
          </DialogDescription>
        </DialogHeader>

        {!isBackendConfigured ? (
          <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            Accounts aren’t connected yet. Add your Supabase values to <code>.env</code> to turn
            them on. You can still shop and check out as a guest.
          </p>
        ) : !ready ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : user ? (
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <AuthForm mode="signin" onDone={close} />
            </TabsContent>
            <TabsContent value="signup">
              <AuthForm mode="signup" onDone={close} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
