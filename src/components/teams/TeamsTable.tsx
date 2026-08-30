"use client";

import { useState, useTransition } from "react";
import type { AppRole } from "@/lib/types";

const ROLE_OPTIONS: AppRole[] = ["viewer", "manager", "hradmin", "superadmin"];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: AppRole;
}

// Real accounts via Supabase Auth now — no plaintext passcode column exists
// anymore (that was the prototype's known, flagged-insecure demo mechanism).
// Only role is editable here; account creation/removal happens through
// Supabase Auth signup/admin, not this table.
export function TeamsTable({
  members,
  currentUserId,
  canManage,
  onUpdateRole,
}: {
  members: TeamMember[];
  currentUserId: string;
  canManage: boolean;
  onUpdateRole: (id: string, role: AppRole) => Promise<void>;
}) {
  return (
    <div className="bg-hud-panel border border-hud-line">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-hud-line">
            {["Name", "Email", "Department", "Role"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-hud-muted uppercase tracking-wide font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <Row key={m.id} member={m} isSelf={m.id === currentUserId} canManage={canManage} onUpdateRole={onUpdateRole} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  member,
  isSelf,
  canManage,
  onUpdateRole,
}: {
  member: TeamMember;
  isSelf: boolean;
  canManage: boolean;
  onUpdateRole: (id: string, role: AppRole) => Promise<void>;
}) {
  const [role, setRole] = useState(member.role);
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-hud-line last:border-b-0">
      <td className="px-4 py-3 text-[13px] text-hud-text font-medium">
        {member.name}
        {isSelf ? " (you)" : ""}
      </td>
      <td className="px-4 py-3 text-xs text-hud-sub">{member.email}</td>
      <td className="px-4 py-3 text-xs text-hud-sub">{member.department ?? "—"}</td>
      <td className="px-4 py-3">
        {canManage ? (
          <select
            value={role}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as AppRole;
              setRole(next);
              startTransition(() => onUpdateRole(member.id, next));
            }}
            className="bg-hud-panelAlt border border-hud-line text-hud-text text-[11px] font-mono uppercase px-2 py-1 focus:outline-none focus:border-hud-cyan"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[11px] text-hud-sub uppercase tracking-wide font-mono">{member.role}</span>
        )}
      </td>
    </tr>
  );
}
