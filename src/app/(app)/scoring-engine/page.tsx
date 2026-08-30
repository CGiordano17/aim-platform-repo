import { SEGMENT_META, PATHWAY_META, SEGMENT_THRESHOLDS, type Pathway } from "@/lib/scoring";
import { SectionLabel } from "@/components/shared/ui";

const PATHWAY_ORDER: Pathway[] = ["enabled", "augmented", "superpowered"];

export default function ScoringEnginePage() {
  return (
    <div className="px-10 py-9 font-body">
      <div className="mb-7">
        <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">Scoring Engine</h1>
        <p className="text-sm text-hud-sub">
          Live cut scores and pathway placement rules — every submitted assessment runs through this logic
          automatically, including multiple-choice weights and server-side LLM-scored open text.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-px mb-px bg-hud-line">
        {PATHWAY_ORDER.map((p) => {
          const meta = PATHWAY_META[p];
          return (
            <div key={p} className="bg-hud-panel p-6" style={{ borderTop: `3px solid ${meta.color}` }}>
              <div className="text-sm font-semibold mb-1" style={{ color: meta.color }}>
                {meta.label}
              </div>
              <p className="text-xs text-hud-sub mb-5 leading-relaxed">{meta.desc}</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Trust", val: meta.trust },
                  { label: "Preparedness", val: meta.prep },
                  { label: "Willingness", val: meta.willingness },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between pb-2.5 border-b border-hud-line">
                    <span className="text-xs text-hud-sub">{r.label}</span>
                    <span className="text-xs font-semibold text-hud-text font-mono">{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-hud-panelAlt">
                <div className="font-mono text-[10px] text-hud-muted mb-1 uppercase tracking-wide">Adoption Curve Range</div>
                <div className="text-xs text-hud-text">{meta.curveRange}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-hud-panel p-6 border border-hud-line mb-px">
        <SectionLabel>Adoption Curve Segment Thresholds</SectionLabel>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-hud-line">
              {["Segment", "Overall Score Range", "% of Population", "Recommended Pathway"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-mono text-[10px] text-hud-muted uppercase tracking-wide font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEGMENT_THRESHOLDS.map((row) => (
              <tr key={row.seg} className="border-b border-hud-line last:border-b-0">
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold" style={{ color: SEGMENT_META[row.seg].color }}>
                    {SEGMENT_META[row.seg].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] font-mono text-hud-text">{row.range}</td>
                <td className="px-4 py-3 text-[13px] text-hud-sub">{SEGMENT_META[row.seg].pct}%</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold" style={{ color: PATHWAY_META[row.pathway].color }}>
                    {PATHWAY_META[row.pathway].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-hud-panel p-6 border border-hud-line">
        <SectionLabel>How Non-Likert Questions Score</SectionLabel>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-[13px] font-semibold text-hud-text mb-1.5">Multiple choice</div>
            <p className="text-xs text-hud-sub leading-relaxed">
              Each option carries an editable 1–5 point value, set per-question in the Assessment Builder. The selected
              option&apos;s value feeds the same dimension average as a likert answer.
            </p>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-hud-text mb-1.5">Open text</div>
            <p className="text-xs text-hud-sub leading-relaxed">
              The response is sent to Claude <strong className="text-hud-text">server-side</strong> with the
              question&apos;s rubric and scored 1–5 at submission time (PRD §6.2). If the scoring call fails, a neutral
              midpoint (3) is used so one bad request never blocks a submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
