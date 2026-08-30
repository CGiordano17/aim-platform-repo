import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Server-side Supabase client for use in Server Components, Server Actions,
// and Route Handlers — reads/writes the auth session via cookies. Still
// respects RLS (uses the anon key); use createAdminClient() only when a
// server-only operation genuinely needs to bypass RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component that can't set cookies — safe to
            // ignore as long as middleware.ts is refreshing the session.
          }
        },
      },
    }
  );
}

// Service-role client: bypasses RLS entirely. Use ONLY in trusted server-only
// code (e.g. the seed script, or the server-side Claude scoring call in PRD
// §6.2) — never import this into anything that runs in the browser, and
// never expose SUPABASE_SERVICE_ROLE_KEY via NEXT_PUBLIC_*.
export function createAdminClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
