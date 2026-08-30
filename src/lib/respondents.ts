import type { Respondent } from "@/lib/types";

export function mapRespondentRow(row: Record<string, unknown>): Respondent {
  return {
    id: row.id as string,
    profileId: (row.profile_id as string) ?? null,
    name: row.name as string,
    department: row.department as string | null,
    role: row.role as string | null,
    level: row.level as string | null,
    preScore: row.pre_score as Respondent["preScore"],
    postScore: (row.post_score as Respondent["postScore"]) ?? null,
    preSegment: row.pre_segment as string | null,
    postSegment: (row.post_segment as string) ?? null,
    pathway: row.pathway as string | null,
    completedPre: row.completed_pre as boolean,
    completedPost: row.completed_post as boolean,
  };
}
