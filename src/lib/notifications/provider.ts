import "server-only";
import type { NotificationProviderKey } from "@/lib/types";

// The agnostic contract every notification channel implements — Slack and
// Microsoft Teams today (src/lib/notifications/slack.ts, teams.ts), chosen
// specifically instead of Google Chat per the client's explicit steer that
// many enterprises avoid Google. A future vendor (e.g. a client that's
// neither) is a new file implementing this interface plus one new entry in
// the provider map (src/lib/notifications/registry.ts) — nothing in the
// dispatch engine, the cron route, or the webhook routes needs to change.

export interface ResolvedExternalUser {
  externalUserId: string;
  externalTeamId?: string;
}

export interface OutgoingNudgeMessage {
  nudgeId: string;
  questionText: string;
  recipient: ResolvedExternalUser;
}

export interface SendResult {
  externalMessageId: string | null;
}

// Normalized shape every provider's webhook parser produces, regardless of
// how differently Slack's Block Kit payload and Teams' Adaptive Card
// Action.Submit payload are actually structured on the wire.
export interface IncomingAction {
  nudgeId: string;
  externalUserId: string;
  value: string;
}

export interface NotificationProvider {
  readonly key: NotificationProviderKey;

  /**
   * Verifies this provider's configured credentials (env vars) actually
   * work, without sending anything to anyone. Backs the Integrations tab's
   * "Connect" button — these providers authenticate via a bot token/app
   * credential set once by an admin, not a per-click OAuth consent screen,
   * so "connecting" means confirming the credentials are valid and
   * recording that, not a redirect flow.
   */
  testConnection(): Promise<boolean>;

  /**
   * Resolve a corporate email to this provider's internal user id. This is
   * what replaces a user-facing "connect your account" step — it runs once,
   * server-side, the first time a nudge needs to reach that person, and the
   * result is cached in `notification_identities`. Returns null if no
   * account exists under that email (e.g. they're not in this Slack
   * workspace / Teams tenant).
   */
  resolveUserByEmail(email: string): Promise<ResolvedExternalUser | null>;

  /** Send an interactive nudge to an already-resolved recipient. */
  sendNudge(message: OutgoingNudgeMessage): Promise<SendResult>;

  /**
   * Verify an inbound webhook request genuinely came from this vendor
   * (Slack's HMAC signature, Teams' Bot Framework JWT) before trusting
   * anything in its body. Takes the raw request body text — signature
   * verification must run over the exact bytes received, not a re-
   * serialized parse of them.
   */
  verifyWebhook(request: Request, rawBody: string): Promise<boolean>;

  /** Parse an already-verified webhook body into a normalized action. */
  parseIncomingAction(rawBody: string): IncomingAction | null;
}
