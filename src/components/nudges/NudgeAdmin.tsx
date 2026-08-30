"use client";

import { useState, useTransition } from "react";
import type { CreateNudgeInput } from "@/app/(app)/nudges/actions";

export interface NudgeRow {
  id: string;
  questionText: string;
  linkedGoalId: string | null;
  linkedGoalTitle: string | null;
  cadence: string;
  targetDepartment: string | null;
  targetRole: string | null;
  responseCount: number;
  recentResponses: { value: string; respondedAt: string }[];
}

export function NudgeAdmin({
  nudges,
  tierZeroGoals,
  onCreate,
}: {
  nudges: NudgeRow[];
  tierZeroGoals: { id: string; title: string }[];
  onCreate: (input: CreateNudgeInput) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [linkedGoalId, setLinkedGoalId] = useState("");
  const [cadence, setCadence] = useState<CreateNudgeInput["cadence"]>("weekly");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!questionText.trim()) return;
    startTransition(async () => {
      await onCreate({
        questionText: questionText.trim(),
        linkedGoalId: linkedGoalId || null,
        cadence,
        targetDepartment: targetDepartment.trim() || null,
        targetRole: targetRole.trim() || null,
      });
      setQuestionText("");
      setLinkedGoalId("");
      setTargetDepartment("");
      setTargetRole("");
      setShowForm(false);
    });
  };

  const inputClass = "w-full px-3 py-2 border border-hud-line text-[13px] text-hud-text bg-hud-panelAlt box-border focus:outline-none focus:border-hud-cyan";

  return (
    <div className="px-10 py-9 font-body">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">Nudge Library</h1>
          <p className="text-sm text-hud-sub">
            Individual-level self-report micro-prompts — Tier 0 evidence for the ROI Measurability Ladder (PRD §2.4).
          </p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="px-4 py-2 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-[13px] cursor-pointer">
          + New Nudge
        </button>
      </div>

      {showForm && (
        <div className="bg-hud-panel border border-hud-line p-6 mb-4 flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Question</label>
            <input className={inputClass} value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="e.g. Have you used an AI-augmented workflow this week?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Linked Tier 0 Goal</label>
              <select className={inputClass} value={linkedGoalId} onChange={(e) => setLinkedGoalId(e.target.value)}>
                <option value="">None</option>
                {tierZeroGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Cadence</label>
              <select className={inputClass} value={cadence} onChange={(e) => setCadence(e.target.value as CreateNudgeInput["cadence"])}>
                <option value="per-completion">Per completion</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Target department (optional)</label>
              <input className={inputClass} value={targetDepartment} onChange={(e) => setTargetDepartment(e.target.value)} placeholder="e.g. Sales" />
            </div>
            <div>
              <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Target role (optional)</label>
              <input className={inputClass} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Account Executive" />
            </div>
          </div>
          <div className="text-[11px] text-hud-muted">Leave department/role blank to target everyone. Per-individual targeting isn&apos;t built yet.</div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-transparent border border-hud-line text-hud-sub text-[13px] cursor-pointer">
              Cancel
            </button>
            <button onClick={submit} disabled={isPending} className="px-4 py-2 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-[13px] cursor-pointer" style={{ opacity: isPending ? 0.6 : 1 }}>
              {isPending ? "Saving…" : "Create Nudge"}
            </button>
          </div>
        </div>
      )}

      {nudges.length === 0 ? (
        <div className="p-10 bg-hud-panel border border-hud-line text-center text-hud-muted text-[13px]">
          No nudges yet. Create one to start collecting Tier 0 self-report signal.
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-hud-line">
          {nudges.map((n) => (
            <div key={n.id} className="bg-hud-panel p-5">
              <div className="flex justify-between items-start gap-4 mb-2">
                <p className="text-[14px] text-hud-text leading-relaxed">{n.questionText}</p>
                <span className="shrink-0 font-mono text-[10px] text-hud-cyan border border-hud-cyan px-2 py-0.5 uppercase">
                  {n.responseCount} response{n.responseCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                {n.linkedGoalTitle && <span className="font-mono text-[9px] text-hud-amber border border-hud-amber px-2 py-0.5 uppercase">→ {n.linkedGoalTitle}</span>}
                <span className="font-mono text-[9px] text-hud-sub border border-hud-line px-2 py-0.5 uppercase">{n.cadence}</span>
                {n.targetDepartment && <span className="font-mono text-[9px] text-hud-sub border border-hud-line px-2 py-0.5 uppercase">dept: {n.targetDepartment}</span>}
                {n.targetRole && <span className="font-mono text-[9px] text-hud-sub border border-hud-line px-2 py-0.5 uppercase">role: {n.targetRole}</span>}
              </div>
              {n.recentResponses.length > 0 && (
                <div className="text-xs text-hud-sub">
                  Recent: {n.recentResponses.map((r) => `"${r.value}"`).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
