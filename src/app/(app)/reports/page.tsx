import { createClient } from "@/lib/supabase/server";
import { mapRespondentRow } from "@/lib/respondents";
import { ReportsView } from "@/components/reports/ReportsView";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("respondents").select("*");

  if (error) {
    return (
      <div className="p-10 text-hud-text font-body text-sm">Couldn&apos;t load Readiness data: {error.message}</div>
    );
  }

  return <ReportsView respondents={(data ?? []).map(mapRespondentRow)} />;
}
