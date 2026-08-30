import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NAV_ITEMS, TAB_PERMS } from "@/lib/nav";
import type { AppRole } from "@/lib/types";
import { signOut } from "./actions";

// Protected app shell: fetches the signed-in user's profile (role +
// department, per PRD §3/§4) and renders the role-gated nav sidebar,
// matching prototype/App.jsx's sidebar exactly. middleware.ts already
// guarantees a session exists by the time this renders.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("name, role, department").eq("id", user.id).single();

  const role = (profile?.role ?? "viewer") as AppRole;
  const visibleNav = NAV_ITEMS.filter((n) => (TAB_PERMS[n.id] ?? []).includes(role));

  return (
    <div className="min-h-screen bg-hud-bg2 font-body flex">
      <div className="w-[220px] bg-hud-panelAlt border-r border-hud-line flex flex-col shrink-0 py-7">
        <div className="px-5 pb-6 border-b border-hud-line mb-2">
          <div className="font-mono text-[10px] text-hud-muted tracking-[0.18em] uppercase mb-1.5">AIM Platform</div>
          <div className="text-hud-text text-[15px] font-medium">Admin Portal</div>
        </div>
        <nav className="flex flex-col">
          {visibleNav.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className="block px-5 py-2.5 text-[13px] text-hud-sub border-l-2 border-transparent hover:text-hud-text hover:border-hud-cyan/40"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-5 pt-4 border-t border-hud-line">
          <div className="text-hud-text text-xs font-medium mb-0.5">{profile?.name ?? user.email}</div>
          <div className="text-hud-muted text-[11px] mb-2.5">{role}</div>
          <form action={signOut}>
            <button type="submit" className="text-hud-muted text-[11px] hover:text-hud-sub">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-screen">{children}</div>
    </div>
  );
}
