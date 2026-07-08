"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OceanScene } from "@/components/scene/ocean-scene";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  initialAuthError?: string | null;
}

function AuthErrorBanner({ message }: { message: string }) {
  const isGoogleSecretError = message.includes("exchange external code");

  return (
    <div role="alert" className="relative mx-auto max-w-6xl px-4 pt-4">
      <div className="rounded-xl border border-pirate-red bg-pirate-red/20 px-4 py-3 text-sm space-y-2">
        {isGoogleSecretError ? (
          <>
            <p>
              <strong>Google Client Secret is invalid.</strong> Supabase auth logs show{" "}
              <code className="text-xs">invalid_client: The provided client secret is invalid</code>.
              Your app code is fine — fix this in the Supabase dashboard:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-(--text-secondary)">
              <li>
                Google Cloud Console → APIs &amp; Services → Credentials → open your{" "}
                <strong>Web application</strong> OAuth client
              </li>
              <li>
                Copy the <strong>Client ID</strong>. Reset and copy a fresh{" "}
                <strong>Client Secret</strong> if unsure.
              </li>
              <li>
                Supabase → Authentication → Providers → Google → paste both values (no
                extra spaces) → Save
              </li>
              <li>
                Supabase → Authentication → URL Configuration → Site URL:{" "}
                <code className="text-xs">http://localhost:3000</code>, Redirect URL:{" "}
                <code className="text-xs">http://localhost:3000/auth/callback</code>
              </li>
            </ol>
          </>
        ) : (
          message
        )}
      </div>
    </div>
  );
}

export function AppShell({
  children,
  userEmail,
  initialAuthError = null,
}: AppShellProps) {
  const [authOpen, setAuthOpen] = useState(Boolean(initialAuthError));
  const [authError, setAuthError] = useState<string | null>(initialAuthError);

  useEffect(() => {
    if (!initialAuthError) return;
    window.history.replaceState(null, "", "/");
  }, [initialAuthError]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <>
      <OceanScene />
      <Header
        userEmail={userEmail}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
      />
      {authError && <AuthErrorBanner message={authError} />}
      <main id="main-content" className="relative mx-auto max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
      <AuthModal
        open={authOpen}
        onOpenChange={(open) => {
          setAuthOpen(open);
          if (!open) setAuthError(null);
        }}
      />
    </>
  );
}
