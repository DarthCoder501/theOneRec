import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { RecommendPanel } from "@/components/recommend/recommend-panel";
import { fetchRateLimit } from "@/lib/api";

interface HomePageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const authError =
    params.error === "auth"
      ? (params.message ?? "Sign-in failed. Please try again or use email/password.")
      : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isMember = !!user;

  let queriesRemaining: number | null = null;
  if (!isMember) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const rateData = await fetchRateLimit(session?.access_token);
      queriesRemaining = rateData?.queries_remaining ?? 5;
    } catch {
      queriesRemaining = 5;
    }
  }

  return (
    <AppShell userEmail={user?.email} initialAuthError={authError}>
      <div className="space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-treasure-gold">
            Chart Your Next Anime Voyage
          </h1>
          <p className="text-(--text-secondary) max-w-2xl mx-auto">
            Tell us what you&apos;re looking for and we&apos;ll lead you to your
            treasure!
          </p>
        </header>
        <RecommendPanel
          isMember={isMember}
          queriesRemaining={queriesRemaining}
        />
      </div>
    </AppShell>
  );
}
