"use client";

const LIKERT_LABELS = ["Strongly\nDisagree", "Disagree", "Neither Agree\nnor Disagree", "Agree", "Strongly\nAgree"];

export function LikertInput({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-between gap-2 max-w-[480px] mx-auto">
      {[1, 2, 3, 4, 5].map((v, i) => (
        <button key={v} onClick={() => onChange(v)} className="flex-1 flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer py-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-semibold transition-all"
            style={{
              border: `1.5px solid ${value === v ? "#5EE6FF" : "#3A4750"}`,
              background: value === v ? "rgba(94,230,255,0.15)" : "transparent",
              color: value === v ? "#5EE6FF" : "#9FB6BC",
            }}
          >
            {v}
          </div>
          <div className="text-[10px] text-hud-muted whitespace-pre-line leading-tight text-center">{LIKERT_LABELS[i]}</div>
        </button>
      ))}
    </div>
  );
}

export function MultipleChoiceInput({ options, value, onChange }: { options: string[]; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2.5 max-w-[480px] mx-auto">
      {(options || []).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="px-4 py-3.5 text-left text-[13px] cursor-pointer"
          style={{
            background: value === opt ? "rgba(94,230,255,0.12)" : "transparent",
            color: value === opt ? "#5EE6FF" : "#EAF6F8",
            border: `1.5px solid ${value === opt ? "#5EE6FF" : "rgba(94,230,255,0.12)"}`,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function TextAnswerInput({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="max-w-[480px] mx-auto">
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer…"
        className="w-full min-h-[120px] px-3.5 py-3 border border-hud-line text-[13px] text-hud-text bg-hud-panelAlt resize-y box-border focus:outline-none focus:border-hud-cyan"
      />
      <div className="text-[10px] text-hud-muted mt-1.5">This answer is scored automatically (server-side).</div>
    </div>
  );
}
