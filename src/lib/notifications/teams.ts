import "server-only";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import type { NotificationProvider, OutgoingNudgeMessage, ResolvedExternalUser, SendResult, IncomingAction } from "./provider";

// Real Microsoft Graph + Bot Framework REST calls against documented specs,
// but never click-tested against a live Teams tenant (this environment has
// no Azure Bot registered). Needs, in .env.example:
//   TEAMS_TENANT_ID, TEAMS_APP_ID, TEAMS_APP_PASSWORD  — the Azure Bot /
//     Entra app registration, created via the Azure Portal (or Teams
//     Toolkit), with Graph Application permission User.Read.All (admin-
//     consented) and the Teams channel enabled.
// A real production bot is also installed org-wide via a Teams app package
// (manifest.json) with the "personal" scope — that's an org-level admin
// action in Teams Admin Center, not something this code can do.
//
// IMPORTANT caveat on verifyWebhook below: this hand-rolls the Bot
// Framework JWT check (issuer/audience/signature via JWKS) because adding
// the full `botbuilder` SDK for one route felt like the wrong tradeoff for
// a channel that isn't even chosen yet. It is NOT the officially
// recommended path — production hardening should switch to `botbuilder`'s
// `CloudAdapter`, which handles token refresh, clock skew, and edge cases
// this hand-rolled version doesn't attempt. Said plainly rather than
// presenting this as more battle-tested than it is.

const GRAPH_TOKEN_URL = (tenantId: string) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const BOT_FRAMEWORK_OPENID_CONFIG = "https://login.botframework.com/v1/.well-known/openidconfiguration";

async function getGraphAppToken(): Promise<string> {
  const tenantId = process.env.TEAMS_TENANT_ID;
  const appId = process.env.TEAMS_APP_ID;
  const appPassword = process.env.TEAMS_APP_PASSWORD;
  if (!tenantId || !appId || !appPassword) throw new Error("TEAMS_TENANT_ID/TEAMS_APP_ID/TEAMS_APP_PASSWORD are not set.");

  const res = await fetch(GRAPH_TOKEN_URL(tenantId), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: appId,
      client_secret: appPassword,
      scope: "https://graph.microsoft.com/.default",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Failed to acquire Graph app token: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function getBotFrameworkToken(): Promise<string> {
  const appId = process.env.TEAMS_APP_ID;
  const appPassword = process.env.TEAMS_APP_PASSWORD;
  if (!appId || !appPassword) throw new Error("TEAMS_APP_ID/TEAMS_APP_PASSWORD are not set.");

  const res = await fetch("https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: appId,
      client_secret: appPassword,
      scope: "https://api.botframework.com/.default",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Failed to acquire Bot Framework token: ${JSON.stringify(data)}`);
  return data.access_token;
}

const jwks = jwksClient({ jwksUri: "https://login.botframework.com/v1/.well-known/keys" });

export const teamsProvider: NotificationProvider = {
  key: "microsoft_teams",

  async resolveUserByEmail(email: string): Promise<ResolvedExternalUser | null> {
    try {
      const token = await getGraphAppToken();
      const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}?$select=id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null; // 404 is the expected case when they're not in this tenant
      const data = await res.json();
      return { externalUserId: data.id, externalTeamId: process.env.TEAMS_TENANT_ID };
    } catch {
      return null;
    }
  },

  async sendNudge(message: OutgoingNudgeMessage): Promise<SendResult> {
    const token = await getBotFrameworkToken();
    const appId = process.env.TEAMS_APP_ID!;
    const serviceUrl = "https://smba.trafficmanager.net/teams/";

    // Proactive 1:1 messaging requires a conversation to exist first — this
    // creates (or Bot Framework reuses, if one already exists) the 1:1 chat
    // between the bot and this specific user within their tenant.
    const convRes = await fetch(`${serviceUrl}v3/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        bot: { id: appId },
        members: [{ id: message.recipient.externalUserId }],
        channelData: { tenant: { id: message.recipient.externalTeamId } },
      }),
    });
    const conv = await convRes.json();
    if (!conv.id) throw new Error(`Failed to create Teams conversation: ${JSON.stringify(conv)}`);

    const activityRes = await fetch(`${serviceUrl}v3/conversations/${conv.id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              type: "AdaptiveCard",
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
              version: "1.4",
              body: [{ type: "TextBlock", text: message.questionText, wrap: true }],
              actions: [
                { type: "Action.Submit", title: "Yes", data: { nudgeId: message.nudgeId, value: "yes" } },
                { type: "Action.Submit", title: "No", data: { nudgeId: message.nudgeId, value: "no" } },
              ],
            },
          },
        ],
      }),
    });
    const activity = await activityRes.json();
    return { externalMessageId: activity.id ?? null };
  },

  async verifyWebhook(request: Request, rawBody: string): Promise<boolean> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.slice("Bearer ".length);

    try {
      const decoded = jwt.decode(token, { complete: true });
      const kid = decoded?.header.kid;
      if (!kid) return false;

      const key = await jwks.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      jwt.verify(token, publicKey, {
        algorithms: ["RS256"],
        audience: process.env.TEAMS_APP_ID,
        issuer: "https://api.botframework.com",
      });
      void rawBody; // the signature is over the JWT itself, not the activity body
      void BOT_FRAMEWORK_OPENID_CONFIG; // documented discovery doc; jwks-rsa goes straight to the known JWKS endpoint
      return true;
    } catch {
      return false;
    }
  },

  parseIncomingAction(rawBody: string): IncomingAction | null {
    const activity = JSON.parse(rawBody);
    if (activity.type !== "message" || !activity.value) return null;

    const { nudgeId, value } = activity.value;
    if (!nudgeId || !value) return null;

    return { nudgeId, externalUserId: activity.from?.id, value };
  },
};
