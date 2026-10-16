import { NextResponse } from "next/server";
import { dispatchDueNudges } from "@/lib/notifications/dispatch";

// Target of the schedule in vercel.json. Vercel's own cron infrastructure
// sends `Authorization: Bearer ${CRON_SECRET}` automatically when
// CRON_SECRET is set as a project env var — this just checks for it, so a
// request that didn't come from Vercel's scheduler (or doesn't know the
// secret) can't trigger a dispatch run.
//
// Note: Vercel's Hobby plan only runs cron jobs once per day, regardless of
// the schedule written in vercel.json — dispatchDueNudges is still correct
// under that constraint (it checks each nudge's own cadence against
// last_dispatched_at), it just means a "weekly" nudge becomes accurate to
// within a day rather than to the hour. Pro plan allows finer-grained cron.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const result = await dispatchDueNudges();
  return NextResponse.json(result);
}
