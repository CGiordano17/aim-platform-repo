import { createClient } from "@/lib/supabase/server";
import { TeamsTable, type TeamMember } from "@/components/teams/TeamsTable";
import { updateUserRole } from "./actions";

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles, error }, { data: currentProfile }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, department, role").order("name"),
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const canManage = currentProfile?.role === "superadmin";
  const members: TeamMember[] = profiles ?? [];

  return (
    <div className="px-10 py-9 font-body">
      <div className="mb-5">
        <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">Team Manager</h1>
        <p className="text-sm text-hud-sub">{members.length} accounts with portal access</p>
      </div>
      {!canManage && (
        <div className="mb-5 px-4 py-3 bg-hud-panel border border-hud-line text-xs text-hud-sub">
          Only superadmins can change roles. New accounts are created via the sign-up form on the login page and default
          to <span className="font-mono">viewer</span> until promoted here.
        </div>
      )}
      {error ? (
        <div className="text-sm text-hud-text">Couldn&apos;t load the team directory: {error.message}</div>
      ) : (
        <TeamsTable members={members} currentUserId={user?.id ?? ""} canManage={canManage} onUpdateRole={updateUserRole} />
      )}
    </div>
  );
}
