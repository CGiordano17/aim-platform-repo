import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/types";
import { TakeAssessmentFlow } from "@/components/survey/TakeAssessmentFlow";
import { submitAssessment } from "./actions";

function mapQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    code: row.code as string,
    dimension: row.dimension as string,
    text: row.text as string,
    type: row.type as Question["type"],
    phase: row.phase as Question["phase"],
    options: (row.options as string[]) ?? undefined,
    optionScores: (row.option_scores as number[]) ?? undefined,
    scoringPrompt: (row.scoring_prompt as string) ?? undefined,
    required: row.required as boolean,
  };
}

export default async function SurveyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // proxy.ts guarantees a session; satisfies TS.

  const [{ data: profile }, { data: existing }, { data: questionRows, error: qError }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.from("respondents").select("department, role, level, completed_pre, completed_post").eq("profile_id", user.id).maybeSingle(),
    supabase.from("questions").select("*"),
  ]);

  if (qError) {
    return (
      <div className="p-10 text-hud-text font-body text-sm">
        Couldn&apos;t load assessment questions: {qError.message}. Has the schema been migrated and seeded (
        <code>npm run db:seed</code>)?
      </div>
    );
  }

  const initialPhase: "pre" | "post" | "done" = !existing ? "pre" : !existing.completed_pre ? "pre" : !existing.completed_post ? "post" : "done";

  return (
    <div className="px-10 py-12 font-body">
      <TakeAssessmentFlow
        questions={(questionRows ?? []).map(mapQuestion)}
        profileName={profile?.name ?? user.email ?? "there"}
        initialPhase={initialPhase}
        defaultDepartment={existing?.department ?? ""}
        defaultRole={existing?.role ?? ""}
        defaultLevel={existing?.level ?? "IC"}
        onSubmit={submitAssessment}
      />
    </div>
  );
}
