import "server-only";
import crypto from "node:crypto";
import type { NotificationProvider, OutgoingNudgeMessage, ResolvedExternalUser, SendResult, IncomingAction } from "./provider";

// Real Slack Web API calls against Slack's documented REST spec — correct
// in shape, but never click-tested against a live workspace (this
// environment has no Slack app credentials). Needs SLACK_BOT_TOKEN and
// SLACK_SIGNING_SECRET (see .env.example) from a real Slack App (api.slack.com/apps)
// with the `chat:write` and `users:read.email` bot scopes, Interactivity
// enabled, and its Request URL pointed at /api/webhooks/slack.

const SLACK_API = "https://slack.com/api";

async function slackCall<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN is not set.");

  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API ${method} failed: ${data.error}`);
  return data as T;
}

export const slackProvider: NotificationProvider = {
  key: "slack",

  async resolveUserByEmail(email: string): Promise<ResolvedExternalUser | null> {
    try {
      const data = await slackCall<{ user: { id: string; team_id: string } }>("users.lookupByEmail", { email });
      return { externalUserId: data.user.id, externalTeamId: data.user.team_id };
    } catch {
      // users_not_found is the expected case when this person isn't in the
      // workspace — not an error worth surfacing beyond "no identity found".
      return null;
    }
  },

  async sendNudge(message: OutgoingNudgeMessage): Promise<SendResult> {
    // Sending chat.postMessage with a user ID as the channel auto-opens (or
    // reuses) the DM with that user — documented Slack behavior, no
    // separate conversations.open call needed.
    const data = await slackCall<{ ts: string }>("chat.postMessage", {
      channel: message.recipient.externalUserId,
      text: message.questionText, // fallback for notifications/screen readers
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: message.questionText } },
        {
          type: "actions",
          elements: [
            { type: "button", text: { type: "plain_text", text: "Yes" }, style: "primary", action_id: "nudge_response", value: `${message.nudgeId}::yes` },
            { type: "button", text: { type: "plain_text", text: "No" }, action_id: "nudge_response", value: `${message.nudgeId}::no` },
          ],
        },
      ],
    });
    return { externalMessageId: data.ts };
  },

  async verifyWebhook(request: Request, rawBody: string): Promise<boolean> {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) return false;

    const timestamp = request.headers.get("x-slack-request-timestamp");
    const signature = request.headers.get("x-slack-signature");
    if (!timestamp || !signature) return false;

    // Reject requests older than 5 minutes — replay protection, per Slack's
    // own verification spec (api.slack.com/authentication/verifying-requests-from-slack).
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 60 * 5) return false;

    const base = `v0:${timestamp}:${rawBody}`;
    const expected = `v0=${crypto.createHmac("sha256", signingSecret).update(base).digest("hex")}`;

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },

  parseIncomingAction(rawBody: string): IncomingAction | null {
    // Slack's interactivity payload arrives as application/x-www-form-urlencoded
    // with a single `payload` field containing JSON.
    const params = new URLSearchParams(rawBody);
    const payloadRaw = params.get("payload");
    if (!payloadRaw) return null;

    const payload = JSON.parse(payloadRaw);
    if (payload.type !== "block_actions") return null;

    const action = payload.actions?.[0];
    if (!action?.value) return null;

    const [nudgeId, value] = String(action.value).split("::");
    if (!nudgeId || !value) return null;

    return { nudgeId, externalUserId: payload.user.id, value };
  },
};
