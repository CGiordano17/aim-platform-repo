// Small shared HUD-styled UI atoms used across Dashboard/Reports/Take
// Assessment — ported from prototype/App.jsx's StatCard/SectionLabel/
// ScoreBar/DistributionBar, restyled to the dark HUD palette (PRD §5).

export function StatCard({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: string }) {
  return (
    <div className="p-5 bg-hud-panel border border-hud-line">
      <div className="font-mono text-[10px] text-hud-muted tracking-[0.12em] uppercase mb-2.5">{label}</div>
      <div className="text-[32px] font-light text-hud-text leading-none tracking-tight">{value}</div>
      {delta && <div className="text-xs text-hud-green mt-1">{delta}</div>}
      {sub && <div className="text-[11px] text-hud-muted mt-1">{sub}</div>}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[10px] text-hud-muted tracking-[0.12em] uppercase mb-5">{children}</div>;
}

export function ScoreBar({ label, pre, post, color }: { label: string; pre: number; post?: number | null; color: string }) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs text-hud-sub tracking-wide">{label}</span>
        <div className="flex gap-3 items-baseline">
          <span className="text-[13px] font-semibold text-hud-text">{pre.toFixed(1)}</span>
          {post != null && post > 0 && (
            <span className="text-[13px] font-semibold text-hud-green">
              → {post.toFixed(1)} <span className="text-[11px] text-hud-green">(+{(post - pre).toFixed(1)})</span>
            </span>
          )}
        </div>
      </div>
      <div className="h-[3px] bg-hud-line relative rounded-sm">
        <div className="absolute left-0 top-0 h-full rounded-sm" style={{ width: `${(pre / 5) * 100}%`, background: "#3A4750" }} />
        {post != null && post > 0 && (
          <div className="absolute left-0 top-0 h-full rounded-sm opacity-70" style={{ width: `${(post / 5) * 100}%`, background: color }} />
        )}
      </div>
    </div>
  );
}

export function DistributionBar({ counts, order, colors }: { counts: Record<string, number>; order: string[]; colors: Record<string, string> }) {
  return (
    <div className="flex h-1.5 rounded overflow-hidden mb-1.5">
      {order.map((key) => (
        <div key={key} style={{ flex: counts[key] || 0.0001, background: colors[key], opacity: 0.8 }} title={`${key}: ${counts[key] ?? 0}`} />
      ))}
    </div>
  );
}
