"use client";

import { useState } from "react";
import type { Respondent } from "@/lib/types";
import { avg, SEGMENT_META, PATHWAY_META, type Segment } from "@/lib/scoring";
import { AdoptionCurve } from "@/components/shared/AdoptionCurve";
import { StatCard, SectionLabel, DistributionBar, ScoreBar } from "@/components/shared/ui";

const SEGMENT_ORDER: Segment[] = ["laggard", "late_majority", "early_majority", "early_adopter", "innovator"];

export function ReportsView({ respondents }: { respondents: Respondent[] }) {
  const [level, setLevel] = useState<"organization" | "department" | "individual">("organization");
  const departments = Array.from(new Set(respondents.map((r) => r.department).filter((d): d is string => !!d)));
  // Lazy-initialized from props on mount — this component remounts fresh on
  // each navigation to /reports (server-fetched respondents, not a live
  // subscription), so there's no later prop change to resync against.
  const [selectedDept, setSelectedDept] = useState(departments[0] ?? "");
  const [selectedRespondent, setSelectedRespondent] = useState<Respondent | null>(respondents[0] ?? null);

  if (!respondents.length) {
    return (
      <div className="p-10 bg-hud-panel border border-hud-line text-center text-hud-muted text-[13px]">
        No respondents yet. Once people take the assessment, reports appear here.
      </div>
    );
  }

  const completed = respondents.filter((r) => r.completedPost).length;
  const preAvg = avg(respondents.map((r) => r.preScore?.overall ?? 0));
  const postAvg = completed ? avg(respondents.filter((r) => r.postScore).map((r) => r.postScore!.overall)) : 0;
  const segCounts: Record<string, number> = { innovator: 0, early_adopter: 0, early_majority: 0, late_majority: 0, laggard: 0 };
  respondents.forEach((r) => {
    if (r.preSegment) segCounts[r.preSegment] = (segCounts[r.preSegment] ?? 0) + 1;
  });
  const topSeg = Object.entries(segCounts).sort((a, b) => b[1] - a[1])[0];
  const superpoweredPct = Math.round((respondents.filter((r) => r.pathway === "superpowered").length / respondents.length) * 100);
  const segColors = Object.fromEntries(SEGMENT_ORDER.map((s) => [s, SEGMENT_META[s].color]));

  return (
    <div className="px-10 py-9 font-body">
      <div className="mb-7">
        <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">Reports</h1>
        <p className="text-sm text-hud-sub mb-5">Pre and post assessment results across all reporting levels</p>
        <div className="flex border border-hud-line w-fit overflow-hidden">
          {(["organization", "department", "individual"] as const).map((l, i) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className="px-5 py-2 text-[13px] cursor-pointer"
              style={{
                background: level === l ? "rgba(94,230,255,0.12)" : "transparent",
                color: level === l ? "#5EE6FF" : "#9FB6BC",
                border: "none",
                borderLeft: i > 0 ? "1px solid rgba(94,230,255,0.12)" : "none",
              }}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {level === "organization" && (
        <div>
          <div className="grid grid-cols-4 gap-px mb-px bg-hud-line">
            <StatCard label="Org Avg Score" value={preAvg.toFixed(2)} sub="overall AIM score" />
            <StatCard label="Top Segment" value={SEGMENT_META[topSeg[0] as Segment].label} sub={`${Math.round((topSeg[1] / respondents.length) * 100)}% of respondents`} />
            <StatCard
              label="Post Uplift"
              value={postAvg ? `+${(postAvg - preAvg).toFixed(2)}` : "—"}
              delta={postAvg ? `${(((postAvg - preAvg) / preAvg) * 100).toFixed(1)}% improvement` : undefined}
              sub="pre → post delta"
            />
            <StatCard label="Superpowered" value={`${superpoweredPct}%`} sub="eligible for advanced track" />
          </div>
          <div className="bg-hud-panel p-7 border border-hud-line mb-px">
            <SectionLabel>Adoption Curve — All Respondents, Pre &amp; Post</SectionLabel>
            <AdoptionCurve respondents={respondents} showPost height={260} />
          </div>
          <div className="grid grid-cols-2 gap-px bg-hud-line">
            {departments.map((dept) => {
              const deptR = respondents.filter((r) => r.department === dept);
              const dAvg = avg(deptR.map((r) => r.preScore?.overall ?? 0));
              const counts = { innovator: 0, early_adopter: 0, early_majority: 0, late_majority: 0, laggard: 0 } as Record<string, number>;
              deptR.forEach((r) => {
                if (r.preSegment) counts[r.preSegment] = (counts[r.preSegment] ?? 0) + 1;
              });
              return (
                <div key={dept} className="bg-hud-panel p-5">
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-sm font-medium text-hud-text">{dept}</span>
                    <span className="text-xl font-light text-hud-text">{dAvg.toFixed(2)}</span>
                  </div>
                  <DistributionBar counts={counts} order={SEGMENT_ORDER} colors={segColors} />
                  <div className="flex gap-2 flex-wrap">
                    {SEGMENT_ORDER.map((seg) => {
                      const count = counts[seg];
                      if (!count) return null;
                      return (
                        <span key={seg} className="text-[10px]" style={{ color: SEGMENT_META[seg].color }}>
                          {count} {SEGMENT_META[seg].label.split(" ")[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {level === "department" && (
        <DeptReport
          departments={departments}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
          respondents={respondents}
          onSelectRespondent={(r) => {
            setSelectedRespondent(r);
            setLevel("individual");
          }}
        />
      )}

      {level === "individual" && selectedRespondent && (
        <IndividualReport respondents={respondents} selected={selectedRespondent} onSelect={setSelectedRespondent} />
      )}
    </div>
  );
}

function DeptReport({
  departments,
  selectedDept,
  setSelectedDept,
  respondents,
  onSelectRespondent,
}: {
  departments: string[];
  selectedDept: string;
  setSelectedDept: (d: string) => void;
  respondents: Respondent[];
  onSelectRespondent: (r: Respondent) => void;
}) {
  const deptR = respondents.filter((r) => r.department === selectedDept);
  const dPreAvg = deptR.length ? avg(deptR.map((r) => r.preScore?.overall ?? 0)) : 0;
  const postComplete = deptR.filter((r) => r.completedPost);
  const dPostAvg = postComplete.length ? avg(postComplete.map((r) => r.postScore!.overall)) : 0;

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {departments.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDept(d)}
            className="px-3.5 py-1.5 text-xs cursor-pointer"
            style={{
              background: selectedDept === d ? "rgba(94,230,255,0.12)" : "transparent",
              color: selectedDept === d ? "#5EE6FF" : "#9FB6BC",
              border: `1px solid ${selectedDept === d ? "#5EE6FF" : "rgba(94,230,255,0.12)"}`,
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-px mb-px bg-hud-line">
        <StatCard label="Dept Avg Pre" value={dPreAvg.toFixed(2)} />
        <StatCard label="Dept Avg Post" value={dPostAvg ? dPostAvg.toFixed(2) : "—"} delta={dPostAvg ? `+${(dPostAvg - dPreAvg).toFixed(2)} uplift` : undefined} />
        <StatCard label="Respondents" value={String(deptR.length)} sub={`${postComplete.length} post complete`} />
      </div>
      <div className="bg-hud-panel p-7 border border-hud-line mb-px">
        <SectionLabel>Adoption Curve — {selectedDept}</SectionLabel>
        <AdoptionCurve respondents={deptR} showPost height={220} />
      </div>
      <div className="bg-hud-panel border border-hud-line overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-hud-line">
              {["Name", "Role", "Pre Segment", "Post Segment", "Pre Score", "Post Score", "Uplift", "Pathway"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-mono text-[10px] text-hud-muted uppercase tracking-wide font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deptR.map((r) => (
              <tr key={r.id} className="border-b border-hud-line last:border-b-0 cursor-pointer hover:bg-hud-line/20" onClick={() => onSelectRespondent(r)}>
                <td className="px-4 py-3 text-[13px] text-hud-text font-medium">{r.name}</td>
                <td className="px-4 py-3 text-xs text-hud-sub">{r.role}</td>
                <td className="px-4 py-3">
                  {r.preSegment && (
                    <span className="text-[11px] font-semibold" style={{ color: SEGMENT_META[r.preSegment as Segment].color }}>
                      {SEGMENT_META[r.preSegment as Segment].label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.postSegment ? (
                    <span className="text-[11px] font-semibold" style={{ color: SEGMENT_META[r.postSegment as Segment].color }}>
                      {SEGMENT_META[r.postSegment as Segment].label}
                    </span>
                  ) : (
                    <span className="text-[11px] text-hud-muted">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-hud-text">{r.preScore?.overall.toFixed(2) ?? "—"}</td>
                <td className="px-4 py-3 text-[13px] text-hud-text">{r.postScore ? r.postScore.overall.toFixed(2) : "—"}</td>
                <td className="px-4 py-3 text-[13px]" style={{ color: r.postScore ? "#7FE0A0" : "#6E8790" }}>
                  {r.postScore && r.preScore ? `+${(r.postScore.overall - r.preScore.overall).toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {r.pathway && (
                    <span className="text-[11px] font-semibold" style={{ color: PATHWAY_META[r.pathway as keyof typeof PATHWAY_META].color }}>
                      {PATHWAY_META[r.pathway as keyof typeof PATHWAY_META].label}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IndividualReport({ respondents, selected, onSelect }: { respondents: Respondent[]; selected: Respondent; onSelect: (r: Respondent) => void }) {
  const r = selected;
  const customPre = r.preScore?.custom ?? {};
  const customPost = r.postScore?.custom ?? {};
  const customKeys = Array.from(new Set([...Object.keys(customPre), ...Object.keys(customPost)]));

  return (
    <div>
      <div className="flex gap-2 items-center mb-5">
        <select
          className="px-3 py-1.5 text-[13px] border border-hud-line bg-hud-panelAlt text-hud-text"
          value={r.id}
          onChange={(e) => {
            const next = respondents.find((x) => x.id === e.target.value);
            if (next) onSelect(next);
          }}
        >
          {respondents.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} — {x.department}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-px bg-hud-line mb-px">
        <div className="bg-hud-panel p-7">
          <div className="mb-5">
            <h2 className="text-xl font-normal text-hud-text mb-1">{r.name}</h2>
            <p className="text-[13px] text-hud-sub">
              {r.role} · {r.department} · {r.level}
            </p>
          </div>
          <SectionLabel>Adoption Curve Position</SectionLabel>
          <AdoptionCurve respondents={[r]} showPost={r.completedPost} height={180} />
        </div>
        <div className="bg-hud-panel p-7">
          <SectionLabel>AIM Profile</SectionLabel>
          {r.preSegment && (
            <div className="mb-5">
              <div className="font-mono text-[10px] text-hud-muted mb-1">PRE SEGMENT</div>
              <div className="text-base font-semibold" style={{ color: SEGMENT_META[r.preSegment as Segment].color }}>
                {SEGMENT_META[r.preSegment as Segment].label}
              </div>
            </div>
          )}
          {r.postSegment && (
            <div className="mb-5">
              <div className="font-mono text-[10px] text-hud-muted mb-1">POST SEGMENT</div>
              <div className="text-base font-semibold" style={{ color: SEGMENT_META[r.postSegment as Segment].color }}>
                {SEGMENT_META[r.postSegment as Segment].label}
              </div>
            </div>
          )}
          {r.pathway && (
            <div className="mb-5">
              <div className="font-mono text-[10px] text-hud-muted mb-1">RECOMMENDED PATHWAY</div>
              <div className="text-sm font-semibold" style={{ color: PATHWAY_META[r.pathway as keyof typeof PATHWAY_META].color }}>
                {PATHWAY_META[r.pathway as keyof typeof PATHWAY_META].label}
              </div>
              <div className="text-[11px] text-hud-sub mt-0.5">{PATHWAY_META[r.pathway as keyof typeof PATHWAY_META].desc}</div>
            </div>
          )}
          <div>
            <div className="font-mono text-[10px] text-hud-muted mb-1">OVERALL SCORE</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-light text-hud-text">{r.preScore?.overall.toFixed(2) ?? "—"}</span>
              {r.postScore && <span className="text-base text-hud-green">→ {r.postScore.overall.toFixed(2)}</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-hud-panel p-7 border border-hud-line">
        <SectionLabel>Dimension Breakdown</SectionLabel>
        <div className="grid grid-cols-2 gap-x-10">
          {[
            { label: "Trust", key: "trust" as const, color: "#5EE6FF" },
            { label: "Willingness", key: "willingness" as const, color: "#F0A94E" },
            { label: "Prep — Foundations", key: "prepFoundations" as const, color: "#7FE0A0" },
            { label: "Prep — Workflow", key: "prepWorkflow" as const, color: "#7FE0A0" },
          ].map((d) => (
            <ScoreBar key={d.label} label={d.label} pre={r.preScore?.[d.key] ?? 0} post={r.postScore?.[d.key]} color={d.color} />
          ))}
        </div>
        {customKeys.length > 0 && (
          <div className="mt-2 pt-4 border-t border-hud-line">
            <div className="font-mono text-[10px] text-hud-muted mb-3 uppercase tracking-wide">Custom Dimensions</div>
            <div className="grid grid-cols-2 gap-x-10">
              {customKeys.map((k) => (
                <ScoreBar key={k} label={k.replace(/-/g, " ")} pre={customPre[k] || 0} post={customPost[k]} color="#F0A94E" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
