"use client";

import { useState, useTransition } from "react";

export interface ApplicableNudge {
  id: string;
  questionText: string;
}

export function NudgesForYou({ nudges, onRespond }: { nudges: ApplicableNudge[]; onRespond: (nudgeId: string, value: string) => Promise<void> }) {
  const [answered, setAnswered] = useState<Set<string>>(new Set());

  if (nudges.length === 0) return null;

  return (
    <div className="bg-hud-panel border border-hud-line p-6 mb-px">
      <div className="font-mono text-[10px] text-hud-muted tracking-[0.12em] uppercase mb-4">Nudges for you</div>
      <div className="flex flex-col gap-4">
        {nudges.map((n) => (
          <NudgeRow key={n.id} nudge={n} answered={answered.has(n.id)} onAnswered={() => setAnswered((s) => new Set(s).add(n.id))} onRespond={onRespond} />
        ))}
      </div>
    </div>
  );
}

function NudgeRow({
  nudge,
  answered,
  onAnswered,
  onRespond,
}: {
  nudge: ApplicableNudge;
  answered: boolean;
  onAnswered: () => void;
  onRespond: (nudgeId: string, value: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const respond = (value: string) => {
    startTransition(async () => {
      await onRespond(nudge.id, value);
      onAnswered();
    });
  };

  if (answered) {
    return <div className="text-xs text-hud-green">✓ {nudge.questionText}</div>;
  }

  return (
    <div>
      <p className="text-[13px] text-hud-text mb-2">{nudge.questionText}</p>
      <div className="flex gap-2">
        <button
          onClick={() => respond("yes")}
          disabled={isPending}
          className="px-3.5 py-1.5 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-xs cursor-pointer"
        >
          Yes
        </button>
        <button
          onClick={() => respond("no")}
          disabled={isPending}
          className="px-3.5 py-1.5 bg-transparent border border-hud-line text-hud-sub text-xs cursor-pointer"
        >
          No
        </button>
      </div>
    </div>
  );
}
