import "server-only";
import type { NotificationProvider } from "./provider";
import { slackProvider } from "./slack";
import { teamsProvider } from "./teams";

// The provider map — this IS the "agnostic, easy for any enterprise to
// plug into" part. Adding a vendor is: write a new file implementing
// NotificationProvider, add one line here, add its `provider` value to the
// two CHECK constraints in supabase/migrations/0004_notification_delivery.sql.
// Nothing in dispatch.ts or the webhook routes changes.
export const NOTIFICATION_PROVIDERS: Record<string, NotificationProvider> = {
  slack: slackProvider,
  microsoft_teams: teamsProvider,
};
