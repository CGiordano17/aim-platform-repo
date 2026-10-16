import { signInWithPassword, signUpWithPassword, signInWithOAuth, signInWithEnterpriseSSO } from "./actions";

// Both auth methods per the resolved PRD §7 decision: email/password
// (hashed by Supabase Auth, replacing the prototype's plaintext passcode)
// and SSO. No Google option by design (see .env.example) — enterprise SSO
// below is vendor-agnostic (any SAML/OIDC IdP an enterprise's IT team
// already runs), and Microsoft OAuth is offered only as a convenience,
// not as the enterprise path. Both still need the matching provider
// registered in the Supabase dashboard before they'll work.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen bg-hud-bg2 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-mono text-[10px] text-hud-muted tracking-[0.18em] uppercase mb-1">AIM Platform</div>
          <h1 className="font-display text-lg text-hud-text tracking-wide">Sign in</h1>
        </div>

        {error && (
          <div className="mb-4 border border-red-500/40 bg-red-500/10 text-red-300 text-xs px-3 py-2 font-mono">{error}</div>
        )}
        {message && (
          <div className="mb-4 border border-hud-cyan/40 bg-hud-cyan/10 text-hud-cyan text-xs px-3 py-2 font-mono">{message}</div>
        )}

        <form action={signInWithPassword} className="flex flex-col gap-3 mb-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="bg-hud-panelAlt border border-hud-line text-hud-text px-3 py-2 text-sm font-body focus:outline-none focus:border-hud-cyan"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="bg-hud-panelAlt border border-hud-line text-hud-text px-3 py-2 text-sm font-body focus:outline-none focus:border-hud-cyan"
          />
          <button
            type="submit"
            className="bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-xs font-mono uppercase tracking-wide py-2 hover:bg-hud-cyan/20"
          >
            Sign in
          </button>
        </form>

        <details className="mb-6">
          <summary className="text-hud-sub text-xs font-mono cursor-pointer uppercase tracking-wide">
            New here? Create an account
          </summary>
          <form action={signUpWithPassword} className="flex flex-col gap-3 mt-3">
            <input
              name="name"
              type="text"
              required
              placeholder="Full name"
              className="bg-hud-panelAlt border border-hud-line text-hud-text px-3 py-2 text-sm font-body focus:outline-none focus:border-hud-cyan"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="bg-hud-panelAlt border border-hud-line text-hud-text px-3 py-2 text-sm font-body focus:outline-none focus:border-hud-cyan"
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 characters)"
              className="bg-hud-panelAlt border border-hud-line text-hud-text px-3 py-2 text-sm font-body focus:outline-none focus:border-hud-cyan"
            />
            <button
              type="submit"
              className="border border-hud-line text-hud-sub text-xs font-mono uppercase tracking-wide py-2 hover:border-hud-cyan hover:text-hud-cyan"
            >
              Create account
            </button>
          </form>
        </details>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-hud-line" />
          <span className="font-mono text-[10px] text-hud-muted uppercase">or</span>
          <div className="flex-1 h-px bg-hud-line" />
        </div>

        <form action={signInWithEnterpriseSSO} className="flex flex-col gap-2 mb-4">
          <label className="font-mono text-[10px] text-hud-muted uppercase tracking-wide">Sign in with company SSO</label>
          <input
            name="domain"
            type="text"
            placeholder="yourcompany.com"
            className="bg-hud-panelAlt border border-hud-line text-hud-text px-3 py-2 text-sm font-body focus:outline-none focus:border-hud-cyan"
          />
          <button
            type="submit"
            className="w-full border border-hud-line text-hud-text text-xs font-mono uppercase tracking-wide py-2 hover:border-hud-cyan"
          >
            Continue with SSO
          </button>
          <p className="text-[11px] text-hud-muted">
            Uses whichever identity provider your IT team has set up (Okta, Entra ID, or any other SAML/OIDC source) —
            nothing to install on your end.
          </p>
        </form>

        <div className="flex flex-col gap-2">
          <form action={signInWithOAuth.bind(null, "azure")}>
            <button
              type="submit"
              className="w-full border border-hud-line text-hud-text text-xs font-mono uppercase tracking-wide py-2 hover:border-hud-cyan"
            >
              Continue with Microsoft
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
