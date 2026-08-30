"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { canonicalDimensionKey } from "@/lib/scoring";
import { QuestionEditor } from "./QuestionEditor";

const BLANK: Question = {
  id: "new",
  code: "",
  dimension: "Trust",
  text: "",
  type: "likert",
  phase: "both",
  options: ["", "", ""],
  optionScores: [1, 3, 5],
  scoringPrompt: "",
  required: true,
};

export function AssessmentBuilder({ initialQuestions, onSave }: { initialQuestions: Question[]; onSave: (q: Question) => Promise<void> }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filterDim, setFilterDim] = useState("All");

  const dimensions = ["All", ...Array.from(new Set(questions.map((q) => q.dimension)))];
  const filtered = filterDim === "All" ? questions : questions.filter((q) => q.dimension === filterDim);

  const handleSave = (q: Question) => {
    setQuestions((prev) => (prev.some((x) => x.code === q.code) ? prev.map((x) => (x.code === q.code ? q : x)) : [...prev, q]));
    onSave(q).catch((err) => console.error("Failed to save question", err));
  };

  return (
    <div className="px-10 py-9 font-body">
      <div className="flex justify-between items-start mb-7 flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">Assessment Builder</h1>
          <p className="text-sm text-hud-sub">
            AIM pre-assessment — {questions.length} questions across {new Set(questions.map((q) => q.dimension)).size} dimensions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingQ({ ...BLANK, id: "new" });
            setShowEditor(true);
          }}
          className="px-4 py-2 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-[13px] cursor-pointer"
        >
          + New Question
        </button>
      </div>
      <div className="flex gap-px mb-px overflow-x-auto">
        {dimensions.map((d) => (
          <button
            key={d}
            onClick={() => setFilterDim(d)}
            className="px-4 py-2 text-xs cursor-pointer whitespace-nowrap shrink-0"
            style={{
              background: filterDim === d ? "rgba(94,230,255,0.1)" : "transparent",
              color: filterDim === d ? "#5EE6FF" : "#9FB6BC",
              border: "1px solid rgba(94,230,255,0.12)",
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="bg-hud-panel border border-hud-line">
        {filtered.map((q, i) => (
          <div key={q.code} className="px-5 py-4 flex gap-4 items-start" style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(94,230,255,0.12)" : "none" }}>
            <span className="text-[10px] text-hud-muted font-mono pt-0.5 shrink-0 min-w-[70px]">{q.code}</span>
            <div className="flex-1">
              <p className="text-[13px] text-hud-text mb-1.5 leading-relaxed">{q.text}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 border border-hud-line text-hud-sub">{q.dimension}</span>
                <span className="text-[10px] px-2 py-0.5 border border-hud-line" style={{ color: q.type === "likert" ? "#5EE6FF" : q.type === "text" ? "#F0A94E" : "#9FB6BC" }}>
                  {q.type === "likert" ? "Likert 1–5" : q.type === "multiple_choice" ? "Multiple Choice" : "Open Text / LLM"}
                </span>
                <span className="text-[10px] px-2 py-0.5 border border-hud-line" style={{ color: q.phase === "both" ? "#7FE0A0" : "#F0A94E" }}>
                  {q.phase === "both" ? "Pre & Post" : q.phase === "pre" ? "Pre only" : "Post only"}
                </span>
                {canonicalDimensionKey(q.dimension).startsWith("custom:") && (
                  <span className="text-[10px] px-2 py-0.5 border border-red-400 text-red-400" title="Doesn't map to a known AIM category — still counts toward overall as its own bucket.">
                    Custom dimension
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setEditingQ(q);
                setShowEditor(true);
              }}
              className="px-3 py-1 bg-transparent border border-hud-line text-hud-sub text-xs cursor-pointer shrink-0"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
      {showEditor && editingQ && <QuestionEditor question={editingQ} onSave={handleSave} onClose={() => setShowEditor(false)} />}
    </div>
  );
}
