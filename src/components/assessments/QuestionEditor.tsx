"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { canonicalDimensionKey, defaultOptionScores } from "@/lib/scoring";

export function QuestionEditor({ question, onSave, onClose }: { question: Question; onSave: (q: Question) => void; onClose: () => void }) {
  const [form, setForm] = useState<Question>(question);
  const set = <K extends keyof Question>(k: K, v: Question[K]) => setForm((f) => ({ ...f, [k]: v }));

  const setOpt = (i: number, v: string) => {
    const o = [...(form.options || [])];
    o[i] = v;
    set("options", o);
  };
  const setOptScore = (i: number, v: string) => {
    const base = form.optionScores && form.optionScores.length === (form.options || []).length ? form.optionScores : defaultOptionScores(form.options || []);
    const s = [...base];
    s[i] = Math.max(1, Math.min(5, Number(v) || 1));
    set("optionScores", s);
  };
  const addOpt = () => {
    const opts = [...(form.options || []), ""];
    set("options", opts);
    set("optionScores", defaultOptionScores(opts));
  };
  const removeOpt = (i: number) => {
    const opts = (form.options || []).filter((_, j) => j !== i);
    set("options", opts);
    set("optionScores", defaultOptionScores(opts));
  };

  const isNew = question.id === "new";
  const inputClass = "w-full px-3 py-2 border border-hud-line rounded-none text-[13px] text-hud-text bg-hud-panelAlt box-border focus:outline-none focus:border-hud-cyan";
  const labelClass = "text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-[rgba(3,5,7,0.6)] flex items-center justify-center z-[100] p-5">
      <div className="bg-hud-panelAlt border border-hud-line px-8 py-8 w-[560px] max-h-[85vh] overflow-y-auto font-body">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-medium text-hud-text m-0">{isNew ? "New Question" : "Edit Question"}</h2>
          <button onClick={onClose} className="bg-transparent border-none text-xl cursor-pointer text-hud-muted">
            ×
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Question Code</label>
              <input className={inputClass} value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="e.g. AIMT01" />
            </div>
            <div>
              <label className={labelClass}>Dimension</label>
              <input className={inputClass} value={form.dimension} onChange={(e) => set("dimension", e.target.value)} />
              <div className="text-[10px] text-hud-muted mt-1 font-mono">bucket: {canonicalDimensionKey(form.dimension)}</div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Question Text</label>
            <textarea
              className={`${inputClass} resize-y min-h-[70px]`}
              value={form.text}
              onChange={(e) => set("text", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Question Type</label>
              <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as Question["type"])}>
                <option value="likert">Likert Scale (1–5)</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="text">Open Text (LLM scored)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Phase</label>
              <select className={inputClass} value={form.phase} onChange={(e) => set("phase", e.target.value as Question["phase"])}>
                <option value="pre">Pre only</option>
                <option value="post">Post only</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          {form.type === "multiple_choice" && (
            <div>
              <label className={labelClass}>Options &amp; Score Weight (1–5)</label>
              {(form.options || []).map((opt, i) => {
                const scores = form.optionScores && form.optionScores.length === (form.options || []).length ? form.optionScores : defaultOptionScores(form.options || []);
                return (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <input className={`${inputClass} flex-1`} value={opt} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.5}
                      className="w-14 px-2 py-2 border border-hud-line text-[13px] text-hud-text bg-hud-panelAlt text-center focus:outline-none focus:border-hud-cyan"
                      value={scores[i]}
                      onChange={(e) => setOptScore(i, e.target.value)}
                    />
                    {(form.options || []).length > 2 && (
                      <button onClick={() => removeOpt(i)} className="px-2.5 bg-transparent border border-hud-line text-hud-muted text-base cursor-pointer">
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              <button onClick={addOpt} className="px-3.5 py-1.5 bg-transparent border border-dashed border-hud-line text-hud-sub text-xs cursor-pointer mt-1">
                + Add option
              </button>
            </div>
          )}
          {form.type === "text" && (
            <div className="p-4 bg-hud-panel border border-hud-line">
              <div className={labelClass}>LLM Scoring Rubric</div>
              <p className="text-xs text-hud-sub mb-2.5 leading-relaxed">
                Sent to Claude server-side alongside the answer at submission time.
              </p>
              <textarea
                className={`${inputClass} resize-y min-h-[70px]`}
                value={form.scoringPrompt || ""}
                onChange={(e) => set("scoringPrompt", e.target.value)}
                placeholder="e.g. Score this response on demonstrated understanding of AI safety principles, 1=none to 5=expert"
              />
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={onClose} className="px-5 py-2 bg-transparent border border-hud-line text-hud-sub text-[13px] cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(form);
                onClose();
              }}
              className="px-5 py-2 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-[13px] cursor-pointer"
            >
              Save Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
