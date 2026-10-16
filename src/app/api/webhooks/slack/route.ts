import { NextResponse } from "next/server";
import { slackProvider } from "@/lib/notifications/slack";
import { recordIncomingResponse } from "@/lib/notifications/dispatch";

// Slack's Request URL target for this bot app's Interactivity settings.
// Unauthenticated by Supabase session on purpose — Slack is calling this
// directly, so the signature check (slackProvider.verifyWebhook) IS the
// authentication.
export async function POST(request: Request) {
  const rawBody = await request.text();

  const verified = await slackProvider.verifyWebhook(request, rawBody);
  if (!verified) return new NextResponse("Invalid signature", { status: 401 });

  const action = slackProvider.parseIncomingAction(rawBody);
  if (action) await recordIncomingResponse(action, "slack");

  // Slack expects a fast 200 regardless of outcome — it retries on
  // non-2xx/timeout, and a dropped signature or malformed payload isn't
  // something retrying fixes.
  return NextResponse.json({ ok: true });
}
