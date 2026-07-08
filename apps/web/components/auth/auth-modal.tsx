"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AuthModal({ open, onOpenChange, trigger }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setMessage("Check your email to confirm your account.");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else { onOpenChange?.(false); window.location.reload(); }
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  }

  const content = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === "signin" ? "Welcome Back, Nakama" : "Join the Crew"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div>
          <Label htmlFor="auth-email">Email</Label>
          <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-(--glass-border) bg-(--deep-sea-light) px-4 py-3 text-(--text-primary) min-h-[44px]" />
        </div>
        <div>
          <Label htmlFor="auth-password">Password</Label>
          <input id="auth-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-(--glass-border) bg-(--deep-sea-light) px-4 py-3 text-(--text-primary) min-h-[44px]" />
        </div>
        {error && <p role="alert" className="text-sm text-pirate-red">{error}</p>}
        {message && <p role="status" className="text-sm text-treasure-gold">{message}</p>}
        <Button type="submit" variant="default" className="w-full" disabled={loading}>{mode === "signin" ? "Sign In" : "Create Account"}</Button>
      </form>
      <Button variant="outline" className="w-full mt-4" onClick={handleGoogleSignIn} type="button">
        Continue with Google
      </Button>
      <p className="text-center text-sm text-(--text-secondary) mt-4">
        {mode === "signin" ? "New to the crew?" : "Already a crew member?"}{" "}
        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }} className="text-treasure-gold underline min-h-[44px]">{mode === "signin" ? "Create account" : "Sign in"}</button>
      </p>
    </DialogContent>
  );

  if (trigger) {
    return (<Dialog open={open} onOpenChange={onOpenChange}><DialogTrigger asChild>{trigger}</DialogTrigger>{content}</Dialog>);
  }
  return (<Dialog open={open} onOpenChange={onOpenChange}>{content}</Dialog>);
}
