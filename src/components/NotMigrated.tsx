// Honest placeholder for tabs not yet ported from prototype/App.jsx into the
// real backend. Mirrors that file's own PlaceholderSection pattern — nav
// stays complete and truthful about what's real vs. not, rather than hiding
// unmigrated tabs.
export function NotMigrated({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-10 py-9 font-body">
      <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">{title}</h1>
      <p className="text-sm text-hud-sub mb-6">{sub}</p>
      <div className="p-10 bg-hud-panel border border-hud-line text-center text-hud-muted text-[13px]">
        Not yet migrated to the real backend — see <code>prototype/App.jsx</code> for the working prototype version of
        this tab.
      </div>
    </div>
  );
}
