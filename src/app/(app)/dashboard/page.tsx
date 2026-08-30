import { createClient } from "@/lib/supabase/server";
import { mapRespondentRow } from "@/lib/respondents";
import { avg, SEGMENT_META, PATHWAY_META, type Segment, type Pathway } from "@/lib/scoring";
import { AdoptionCurve } from "@/components/shared/AdoptionCurve";
import { StatCard, SectionLabel, ScoreBar } from "@/components/shared/ui";

const SEGMENT_ORDER: Segment[] = ["innovator", "early_adopter", "early_majority", "late_majority", "laggard"];
const PATHWAY_ORDER: Pathway[] = ["enabled", "augmented", "superpowered"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("respondents").select("*");

  if (error) {
    return (
      <div className="p-10 text-hud-text font-body text-sm">Couldn&apos;t load Readiness data: {error.message}</div>
    );
  }

  const respondents = (data ?? []).map(mapRespondentRow);
  const completed = respondents.filter((r) => r.completedPost).length;
  const preAvg = avg(respondents.map((r) => r.preScore?.overall ?? 0));
  const postAvg = completed ? avg(respondents.filter((r) => r.postScore).map((r) => r.postScore!.overall)) : 0;

  const dims = [
    { label: "Trust", key: "trust" as const, color: "#5EE6FF" },
    { label: "Willingness", key: "willingness" as const, color: "#F0A94E" },
    { label: "Preparedness", key: "prepFoundations" as const, color: "#7FE0A0" },
  ];

  return (
    <div className="px-10 py-9 font-body">
      <div className="mb-8">
        <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">AIM Readiness Overview</h1>
        <p className="text-sm text-hud-sub">AI Measurement framework — pre and post assessment tracking</p>
      </div>

      {respondents.length === 0 ? (
        <div className="p-10 bg-hud-panel border border-hud-line text-center text-hud-muted text-[13px]">
          No respondents yet. Once people take the assessment, this dashboard fills in.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-px mb-px bg-hud-line">
            <StatCard label="Total Respondents" value={String(respondents.length)} sub="completed pre-assessment" />
            <StatCard
              label="Post Complete"
              value={String(completed)}
              sub={respondents.length ? `${Math.round((completed / respondents.length) * 100)}% completion rate` : "—"}
            />
            <StatCard label="Avg Pre Score" value={preAvg ? preAvg.toFixed(2) : "—"} sub="across all dimensions" />
            <StatCard
              label="Avg Uplift"
              value={postAvg ? `+${(postAvg - preAvg).toFixed(2)}` : "—"}
              delta={postAvg ? `${(((postAvg - preAvg) / preAvg) * 100).toFixed(1)}% improvement` : undefined}
              sub="pre → post delta"
            />
          </div>
          <div className="grid grid-cols-[3fr_2fr] gap-px bg-hud-line mb-px">
            <div className="bg-hud-panel p-7">
              <SectionLabel>Technology Adoption Curve — Full Organization</SectionLabel>
              <AdoptionCurve respondents={respondents} showPost height={220} />
            </div>
            <div className="bg-hud-panel p-7">
              <SectionLabel>Segment Distribution</SectionLabel>
              {SEGMENT_ORDER.map((seg) => {
                const preCount = respondents.filter((r) => r.preSegment === seg).length;
                const postCount = respondents.filter((r) => r.postSegment === seg).length;
                const meta = SEGMENT_META[seg];
                return (
                  <div key={seg} className="flex items-center gap-3 mb-3.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs text-hud-text">{meta.label}</span>
                        <span className="text-xs text-hud-sub">
                          {preCount} → <span style={{ color: meta.color, fontWeight: 600 }}>{postCount}</span>
                        </span>
                      </div>
                      <div className="h-0.5 bg-hud-line">
                        <div className="h-full opacity-40" style={{ width: `${respondents.length ? (preCount / respondents.length) * 100 : 0}%`, background: meta.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="mt-5 pt-5 border-t border-hud-line">
                <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wide mb-2.5">Training Pathway Placement</div>
                {PATHWAY_ORDER.map((p) => {
                  const count = respondents.filter((r) => r.pathway === p).length;
                  const meta = PATHWAY_META[p];
                  return (
                    <div key={p} className="flex justify-between items-center mb-2">
                      <span className="text-xs text-hud-text">{meta.label}</span>
                      <span className="text-xs font-semibold" style={{ color: meta.color }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="bg-hud-panel p-7 border border-hud-line">
            <SectionLabel>Dimension Scores — Organization Average</SectionLabel>
            <div className="grid grid-cols-3 gap-6">
              {dims.map((d) => (
                <ScoreBar
                  key={d.label}
                  label={d.label}
                  pre={avg(respondents.map((r) => r.preScore?.[d.key] ?? 0))}
                  post={completed ? avg(respondents.filter((r) => r.postScore).map((r) => r.postScore![d.key])) : 0}
                  color={d.color}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
