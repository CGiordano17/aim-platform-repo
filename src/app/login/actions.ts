"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? email);
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  // New accounts default to the 'viewer' role via the handle_new_user()
  // trigger (supabase/migrations/0001_init.sql) — never trust a client-set
  // role at signup. A superadmin/hradmin promotes from the Teams tab.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/login?message=Check your email to confirm your account.");
}

// Microsoft personal/work-account OAuth, offered as a convenience sign-in —
// deliberately no "google" option (see .env.example). This is separate from
// enterprise SSO below: this is one specific vendor's consumer OAuth flow,
// not a SAML/OIDC connection an enterprise IT team controls.
export async function signInWithOAuth(provider: "azure") {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  if (data.url) redirect(data.url);
}

// Vendor-agnostic enterprise SSO: Supabase resolves the email domain to
// whichever SAML/OIDC identity provider that enterprise registered for it
// (Okta, Entra ID, OneLogin, PingFederate — anything) via `supabase sso add`
// against their own tenant. We never choose or hardcode an IdP vendor here —
// this is what makes the login path something any enterprise IT team can
// plug their own identity stack into, which is the whole point.
export async function signInWithEnterpriseSSO(formData: FormData) {
  const domain = String(formData.get("domain") ?? "").trim();
  if (!domain) {
    redirect(`/login?error=${encodeURIComponent("Enter your company email domain.")}`);
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithSSO({
    domain,
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "No SSO connection is set up for that domain yet.")}`);
  }
  redirect(data.url);
}
