import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — uses the public anon key. Access control is
// enforced by RLS policies (supabase/migrations/0001_init.sql), not by
// keeping this key secret; it's safe to ship to the client.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
