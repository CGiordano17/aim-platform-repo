import { NextResponse } from "next/server";
import { teamsProvider } from "@/lib/notifications/teams";
import { recordIncomingResponse } from "@/lib/notifications/dispatch";

// The messaging endpoint configured on this bot's Azure Bot resource.
// Unauthenticated by Supabase session on purpose — the Bot Framework JWT
// check (teamsProvider.verifyWebhook) IS the authentication. See teams.ts's
// top-of-file comment for the honest caveat on that check's rigor.
export async function POST(request: Request) {
  const rawBody = await request.text();

  const verified = await teamsProvider.verifyWebhook(request, rawBody);
  if (!verified) return new NextResponse("Invalid token", { status: 401 });

  const action = teamsProvider.parseIncomingAction(rawBody);
  if (action) await recordIncomingResponse(action, "microsoft_teams");

  return NextResponse.json({ type: "message", text: "Thanks — logged." });
}
