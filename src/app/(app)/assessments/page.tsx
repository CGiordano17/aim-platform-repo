import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/types";
import { AssessmentBuilder } from "@/components/assessments/AssessmentBuilder";
import { saveQuestion } from "./actions";

function mapRow(row: Record<string, unknown>): Question {
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

export default async function AssessmentsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("questions").select("*").order("code");

  if (error) {
    return (
      <div className="p-10 text-hud-text font-body text-sm">
        Couldn&apos;t load questions: {error.message}. Has the schema been migrated and seeded (<code>npm run db:seed</code>)?
      </div>
    );
  }

  return <AssessmentBuilder initialQuestions={(data ?? []).map(mapRow)} onSave={saveQuestion} />;
}
