import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CookieToSet } from "@/lib/supabase/cookie-types";

function authErrorRedirect(origin: string, message: string) {
  const url = new URL("/", origin);
  url.searchParams.set("error", "auth");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";

  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (oauthError) {
    const message =
      errorDescription?.replace(/\+/g, " ") ??
      "Google sign-in failed. Check Supabase Google provider credentials.";
    return authErrorRedirect(origin, message);
  }

  if (!code) {
    return authErrorRedirect(
      origin,
      "Missing auth code. Please try signing in again.",
    );
  }

  const cookieStore = await cookies();
  const redirectUrl = new URL(safeNext, origin);
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return authErrorRedirect(origin, error.message);
  }

  return response;
}
