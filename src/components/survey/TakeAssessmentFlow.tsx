"use client";

import { useState, useTransition } from "react";
import type { Question } from "@/lib/types";
import { SEGMENT_META, PATHWAY_META } from "@/lib/scoring";
import type { SubmitAssessmentInput, SubmitAssessmentResult } from "@/app/(app)/survey/actions";
import { AdoptionCurve } from "@/components/shared/AdoptionCurve";
import { ScoreBar, SectionLabel } from "@/components/shared/ui";
import { LikertInput, MultipleChoiceInput, TextAnswerInput } from "./inputs";

type Answers = Record<string, string | number>;

export function TakeAssessmentFlow({
  questions,
  profileName,
  initialPhase,
  defaultDepartment,
  defaultRole,
  defaultLevel,
  onSubmit,
}: {
  questions: Question[];
  profileName: string;
  initialPhase: "pre" | "post" | "done";
  defaultDepartment: string;
  defaultRole: string;
  defaultLevel: string;
  onSubmit: (input: SubmitAssessmentInput) => Promise<SubmitAssessmentResult>;
}) {
  const [stage, setStage] = useState<"done" | "intake" | "questions" | "result">(initialPhase === "done" ? "done" : "intake");
  const [phase] = useState<"pre" | "post">(initialPhase === "post" ? "post" : "pre");
  const [department, setDepartment] = useState(defaultDepartment);
  const [role, setRole] = useState(defaultRole);
  const [level, setLevel] = useState(defaultLevel || "IC");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<SubmitAssessmentResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const flowQuestions = questions.filter((q) => q.phase === "both" || q.phase === phase);

  const setAnswer = (qId: string, val: string | number) => setAnswers((a) => ({ ...a, [qId]: val }));

  const startAssessment = () => {
    setError("");
    if (!department.trim()) {
      setError("Department is required to start.");
      return;
    }
    setQIndex(0);
    setAnswers({});
    setStage("questions");
  };

  const goBack = () => {
    if (qIndex > 0) setQIndex((i) => i - 1);
    else setStage("intake");
  };

  const submit = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await onSubmit({ department: department.trim(), role: role.trim() || "—", level, phase, answers });
        setResult(res);
        setStage("result");
      } catch (e) {
        console.error(e);
        setError("Something went wrong scoring or saving your response. Please try again.");
      }
    });
  };

  const goNext = () => {
    if (qIndex < flowQuestions.length - 1) setQIndex((i) => i + 1);
    else submit();
  };

  if (stage === "done") {
    return (
      <div className="max-w-[480px] mx-auto text-center py-16">
        <div className="font-mono text-[11px] text-hud-muted tracking-[0.14em] uppercase mb-3">AIM Assessment</div>
        <h1 className="text-2xl font-light text-hud-text mb-2">You&apos;re all set, {profileName.split(" ")[0]}.</h1>
        <p className="text-[13px] text-hud-sub">You&apos;ve completed both the pre and post assessments. See your results in Reports.</p>
      </div>
    );
  }

  if (stage === "intake") {
    return (
      <div className="max-w-[480px] mx-auto">
        <div className="mb-7">
          <div className="font-mono text-[11px] text-hud-muted tracking-[0.14em] uppercase mb-2">
            AIM Assessment · {phase === "pre" ? "Pre" : "Post"}
          </div>
          <h1 className="text-[26px] font-light text-hud-text mb-2">{phase === "pre" ? "Let's find your starting point" : "Let's see how things have shifted"}</h1>
          <p className="text-[13px] text-hud-sub leading-relaxed">
            A short mix of scale, choice, and short-answer questions across Trust, Willingness, and Preparedness.
          </p>
        </div>
        <div className="flex flex-col gap-3.5 bg-hud-panel border border-hud-line p-6">
          <div>
            <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Name</label>
            <div className="text-[13px] text-hud-text px-3 py-2 bg-hud-panelAlt border border-hud-line">{profileName}</div>
          </div>
          <div>
            <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Department</label>
            <input
              className="w-full px-3 py-2 border border-hud-line text-[13px] text-hud-text bg-hud-panelAlt box-border focus:outline-none focus:border-hud-cyan"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Role</label>
              <input
                className="w-full px-3 py-2 border border-hud-line text-[13px] text-hud-text bg-hud-panelAlt box-border focus:outline-none focus:border-hud-cyan"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Product Manager"
              />
            </div>
            <div>
              <label className="text-[11px] text-hud-muted block mb-1.5 uppercase tracking-wide">Level</label>
              <select
                className="w-full px-3 py-2 border border-hud-line text-[13px] text-hud-text bg-hud-panelAlt focus:outline-none focus:border-hud-cyan"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="IC">Individual Contributor</option>
                <option value="Senior IC">Senior IC</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          <button onClick={startAssessment} className="py-2.5 mt-1 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-[13px] font-medium cursor-pointer">
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  if (stage === "questions") {
    const q = flowQuestions[qIndex];
    const progress = ((qIndex + 1) / flowQuestions.length) * 100;
    const currentVal = answers[q.id];
    const hasAnswer = q.type === "text" ? String(currentVal || "").trim().length > 0 : currentVal != null;

    return (
      <div className="max-w-[640px] mx-auto">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[11px] text-hud-muted uppercase tracking-wide">{q.dimension}</span>
          <span className="text-[11px] text-hud-muted">
            {qIndex + 1} / {flowQuestions.length}
          </span>
        </div>
        <div className="h-[3px] bg-hud-line mb-10">
          <div className="h-full bg-hud-cyan transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[19px] font-normal text-hud-text leading-relaxed mb-12 min-h-[60px]">{q.text}</p>
        {q.type === "likert" && <LikertInput value={currentVal as number | undefined} onChange={(v) => setAnswer(q.id, v)} />}
        {q.type === "multiple_choice" && <MultipleChoiceInput options={q.options || []} value={currentVal as string | undefined} onChange={(v) => setAnswer(q.id, v)} />}
        {q.type === "text" && <TextAnswerInput value={currentVal as string | undefined} onChange={(v) => setAnswer(q.id, v)} />}
        {error && <div className="text-xs text-red-400 mt-5 text-center">{error}</div>}
        <div className="flex justify-between mt-14">
          <button onClick={goBack} className="px-5 py-2 bg-transparent border border-hud-line text-hud-sub text-[13px] cursor-pointer">
            Back
          </button>
          <button
            onClick={() => {
              if (!hasAnswer) {
                setError("Please answer to continue.");
                return;
              }
              setError("");
              goNext();
            }}
            disabled={isPending}
            className="px-6 py-2 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-[13px]"
            style={{ opacity: isPending ? 0.6 : 1, cursor: isPending ? "default" : "pointer" }}
          >
            {isPending ? "Scoring…" : qIndex === flowQuestions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "result" && result) {
    const meta = SEGMENT_META[result.segment];
    const pathMeta = PATHWAY_META[result.pathway];
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="mb-7">
          <div className="font-mono text-[11px] text-hud-muted tracking-[0.14em] uppercase mb-2">
            {result.phase === "pre" ? "Pre-assessment complete" : "Post-assessment complete"}
          </div>
          <h1 className="text-[26px] font-light text-hud-text mb-2">Thanks, {result.name.split(" ")[0]}.</h1>
          <p className="text-[13px] text-hud-sub">Here&apos;s where you land today.</p>
        </div>
        <div className="bg-hud-panel border border-hud-line p-7 mb-4">
          <AdoptionCurve respondents={[{ id: "me", preSegment: result.segment, postSegment: result.phase === "post" ? result.segment : null }]} showPost={result.phase === "post"} height={200} />
        </div>
        <div className="grid grid-cols-2 gap-px bg-hud-line mb-4">
          <div className="bg-hud-panel p-5">
            <div className="font-mono text-[10px] text-hud-muted mb-1.5 uppercase tracking-wide">Segment</div>
            <div className="text-lg font-semibold" style={{ color: meta.color }}>
              {meta.label}
            </div>
          </div>
          <div className="bg-hud-panel p-5">
            <div className="font-mono text-[10px] text-hud-muted mb-1.5 uppercase tracking-wide">Recommended Pathway</div>
            <div className="text-lg font-semibold" style={{ color: pathMeta.color }}>
              {pathMeta.label}
            </div>
          </div>
        </div>
        <div className="bg-hud-panel p-6 border border-hud-line">
          <SectionLabel>Your Dimension Scores</SectionLabel>
          <ScoreBar label="Trust" pre={result.scores.trust} color="#5EE6FF" />
          <ScoreBar label="Willingness" pre={result.scores.willingness} color="#F0A94E" />
          <ScoreBar label="Prep — Foundations" pre={result.scores.prepFoundations} color="#7FE0A0" />
          <ScoreBar label="Prep — Workflow" pre={result.scores.prepWorkflow} color="#7FE0A0" />
        </div>
      </div>
    );
  }

  return null;
}
