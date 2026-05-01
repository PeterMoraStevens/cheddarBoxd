import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

// Behind a reverse proxy, request.url may contain the internal host (localhost:3000)
// rather than the public-facing URL. NEXT_PUBLIC_SITE_URL overrides it.
function siteOrigin(requestOrigin: string) {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? requestOrigin).replace(/\/$/, "");
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";
  const base = siteOrigin(origin);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    console.log("Exchange error:", error);
    console.log("Exchange data:", data?.user?.email);
    if (!error && data.user) {
      console.log("Exchange error:", error);
      console.log("Exchange user:", data?.user?.email);
      console.log(
        "Exchange session:",
        data?.session?.access_token ? "exists" : "null",
      );
      const createdAt = new Date(data.user.created_at).getTime();
      const isNewUser = Date.now() - createdAt < 2 * 60 * 1000;

      const destination = isNewUser ? `/feed?welcome=1` : next;
      return NextResponse.redirect(`${base}${destination}`);
    }
  }

  return NextResponse.redirect(`${base}/auth/login?error=auth_failed`);
}
