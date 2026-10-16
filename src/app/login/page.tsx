import { signInWithPassword, signUpWithPassword, signInWithOAuth, signInWithEnterpriseSSO } from "./actions";
import { AppShellBackdrop } from "@/components/three/AppShellBackdrop";

const FRAMEWORK_STAGES = ["Identify", "Inform", "Invest", "Inspire", "Instill"];

// Both auth methods per the resolved PRD §7 decision: email/password
// (hashed by Supabase Auth, replacing the prototype's plaintext passcode)
// and SSO. No Google option by design (see .env.example) — enterprise SSO
// below is vendor-agnostic (any SAML/OIDC IdP an enterprise's IT team
// already runs), and Microsoft OAuth is offered only as a convenience,
// not as the enterprise path. Both still need the matching provider
// registered in the Supabase dashboard before they'll work.
//
// Asymmetric split layout, not a centered box — the brand side carries the
// First Person Framework as the first thing anyone sees, the form side is
// offset rather than vertically centered. AppShellBackdrop (normally only
// inside the authenticated shell) runs here too, since this is the very
// first screen the three.js work should be visible on.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const inputClass =
    "bg-hud-panelAlt border border-hud-line text-hud-text px-3 py-2.5 text-sm font-body focus:outline-none focus:border-hud-cyan";

  return (
    <div className="min-h-screen bg-hud-bg2 flex flex-col md:flex-row">
      <AppShellBackdrop />

      {/* Brand side — wider, asymmetric, anchored to the bottom rather
          than centered. The framework stages step diagonally instead of
          stacking flush-left. */}
      <div className="relative md:flex-[1.3] flex flex-col justify-end px-8 md:px-16 py-12 md:py-20 min-h-[40vh] md:min-h-screen overflow-hidden">
        <div className="font-mono text-[10px] text-hud-muted tracking-[0.22em] uppercase mb-4">AIM Platform</div>
        <h1 className="font-display text-[clamp(28px,5vw,56px)] text-hud-text leading-[1.08] tracking-tight mb-10 max-w-xl">
          Measuring the AI workforce transformation.
        </h1>
        <div className="flex flex-col gap-1.5">
          {FRAMEWORK_STAGES.map((stage, i) => (
            <div
              key={stage}
              className="font-mono text-xs md:text-sm uppercase tracking-[0.1em] text-hud-sub"
              style={{ marginLeft: `${i * 22}px`, opacity: 0.55 + i * 0.11 }}
            >
              <span className="text-hud-cyan mr-2">{String(i + 1).padStart(2, "0")}</span>
              {stage}
            </div>
          ))}
        </div>
      </div>

      {/* Form side — fixed width, hairline border instead of a boxed card,
          anchored toward the top instead of vertically centered. */}
      <div className="md:flex-1 md:max-w-md border-t md:border-t-0 md:border-l border-hud-line px-8 md:px-12 pt-14 pb-12 flex flex-col">
        <h2 className="font-display text-base text-hud-text tracking-wide mb-8">Sign in</h2>

        {error && <div className="mb-4 border border-red-500/40 bg-red-500/10 text-red-300 text-xs px-3 py-2 font-mono">{error}</div>}
        {message && (
          <div className="mb-4 border border-hud-cyan/40 bg-hud-cyan/10 text-hud-cyan text-xs px-3 py-2 font-mono">{message}</div>
        )}

        <form action={signInWithPassword} className="flex flex-col gap-3 mb-4">
          <input name="email" type="email" required placeholder="Email" className={inputClass} />
          <input name="password" type="password" required placeholder="Password" className={inputClass} />
          <button
            type="submit"
            className="bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-xs font-mono uppercase tracking-wide py-2.5 ease-hud hover:bg-hud-cyan/20 hover:tracking-[0.14em]"
          >
            Sign in
          </button>
        </form>

        <details className="mb-6">
          <summary className="text-hud-sub text-xs font-mono cursor-pointer uppercase tracking-wide ease-hud hover:text-hud-text">
            New here? Create an account
          </summary>
          <form action={signUpWithPassword} className="flex flex-col gap-3 mt-3">
            <input name="name" type="text" required placeholder="Full name" className={inputClass} />
            <input name="email" type="email" required placeholder="Email" className={inputClass} />
            <input name="password" type="password" required minLength={8} placeholder="Password (min 8 characters)" className={inputClass} />
            <button
              type="submit"
              className="border border-hud-line text-hud-sub text-xs font-mono uppercase tracking-wide py-2.5 ease-hud hover:border-hud-cyan hover:text-hud-cyan"
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
          <input name="domain" type="text" placeholder="yourcompany.com" className={inputClass} />
          <button
            type="submit"
            className="w-full border border-hud-line text-hud-text text-xs font-mono uppercase tracking-wide py-2.5 ease-hud hover:border-hud-cyan"
          >
            Continue with SSO
          </button>
          <p className="text-[11px] text-hud-muted">
            Uses whichever identity provider your IT team has set up (Okta, Entra ID, or any other SAML/OIDC source) —
            nothing to install on your end.
          </p>
        </form>

        <form action={signInWithOAuth.bind(null, "azure")}>
          <button
            type="submit"
            className="w-full border border-hud-line text-hud-text text-xs font-mono uppercase tracking-wide py-2.5 ease-hud hover:border-hud-cyan"
          >
            Continue with Microsoft
          </button>
        </form>
      </div>
    </div>
  );
}
