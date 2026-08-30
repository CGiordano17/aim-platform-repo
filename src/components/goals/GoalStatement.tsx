import type { GoalStatementParts } from "@/lib/types";

// The three-part statement (PRD §2.4) — non-negotiable format for every
// Transformation Goal: "The business will [action] by people who [resources]
// to achieve [outcome]," with each lead-in phrase color-coded.
export function GoalStatement({ statement }: { statement: GoalStatementParts }) {
  return (
    <div className="text-[12px] leading-relaxed text-[#D7E6E9]">
      <span className="text-hud-cyan font-bold">The business will</span> {statement.action},{" "}
      <span className="text-hud-amber font-bold">by people who</span> {statement.resources},{" "}
      <span className="text-hud-green font-bold">to achieve</span> {statement.outcome}.
    </div>
  );
}
