"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReviewEntry {
  id: string;
  note: string | null;
  flagged: boolean;
  created_at: string;
}

// Tier 1 manual-entry admin form (PRD build phase 4) — a log of individual
// expert-review events, not just one overwritable currentValue. Fetches
// client-side (still RLS-respecting via the browser client's session) so
// GoalDetail doesn't need this threaded through server-fetched props for
// every goal up front.
export function Tier1ReviewLog({ goalId, onLog }: { goalId: string; onLog: (goalId: string, note: string, flagged: boolean) => Promise<void> }) {
  const [entries, setEntries] = useState<ReviewEntry[] | null>(null);
  const [note, setNote] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("goal_review_entries")
      .select("id, note, flagged, created_at")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setEntries(data ?? []);
  }, [goalId]);

  useEffect(() => {
    // Fetching data on mount — the canonical effect use case, distinct from
    // deriving state synchronously from already-available props (which is
    // what this lint rule is really meant to catch). setState only runs
    // after the awaited query resolves, not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const submit = () => {
    setError("");
    startTransition(async () => {
      try {
        await onLog(goalId, note, flagged);
        setNote("");
        setFlagged(false);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to log review.");
      }
    });
  };

  const flaggedCount = entries?.filter((e) => e.flagged).length ?? 0;

  return (
    <div className="mt-2 pt-4 border-t border-hud-line">
      <div className="font-mono text-[10px] text-hud-muted uppercase mb-2 flex justify-between items-baseline">
        <span>Manual Review Log</span>
        {entries && entries.length > 0 && (
          <span className="text-hud-sub normal-case">
            {entries.length} reviewed, {flaggedCount} flagged ({((flaggedCount / entries.length) * 100).toFixed(0)}%)
          </span>
        )}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reviewer note (optional)"
          className="flex-1 min-w-0 bg-hud-panelAlt border border-hud-line text-hud-text px-2.5 py-1.5 text-xs focus:outline-none focus:border-hud-cyan"
        />
        <label className="flex items-center gap-1.5 text-xs text-hud-sub shrink-0">
          <input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} />
          Flagged
        </label>
        <button onClick={submit} disabled={isPending} className="shrink-0 px-3 py-1.5 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-xs cursor-pointer">
          {isPending ? "Logging…" : "Log review"}
        </button>
      </div>
      {error && <div className="text-[11px] text-red-400 mb-2">{error}</div>}
      {entries === null ? (
        <div className="text-[11px] text-hud-muted">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="text-[11px] text-hud-muted">No reviews logged yet.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((e) => (
            <div key={e.id} className="flex gap-2 items-baseline text-[11px]">
              <span className="text-hud-muted font-mono shrink-0">{new Date(e.created_at).toLocaleDateString()}</span>
              {e.flagged && <span className="text-red-400 shrink-0">⚑</span>}
              <span className="text-hud-sub truncate">{e.note || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
