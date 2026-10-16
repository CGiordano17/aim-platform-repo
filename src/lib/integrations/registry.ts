// The Integrations Registry pattern (PRD §6.2, build phase 6): OAuth config
// happens once per vendor HERE, not custom-built per Goal/feature. The
// admin Integrations tab is just a list view over whatever's registered in
// this array plus the `public.integrations` table's connected instances.
//
// Two purposes share this one registry, distinguished by `purpose`:
//   - "notification": delivers Nudges to people (Slack, Microsoft Teams —
//     see src/lib/notifications/). Built because the client specifically
//     asked for push-style nudges; Google Chat deliberately excluded.
//   - "metrics_sync": pulls Tier 2/3 ROI-ladder metrics into Transformation
//     Goals (PRD §6.2's original framing). Still empty — no vendor chosen
//     for THIS purpose; don't confuse "we picked Slack/Teams for delivery"
//     with "we picked a metrics vendor" — those are separate decisions.
//
// Adding a connector of either purpose is a code change here, not a
// runtime configuration step.

export interface ConnectorDefinition {
  id: string;
  vendorName: string;
  description: string;
  purpose: "notification" | "metrics_sync";
  authType: "oauth" | "bot_token";
  requiredScopes: string[];
  /** Metric names this connector can sync into TransformationGoal.currentValue — "metrics_sync" purpose only. */
  syncedMetrics: string[];
}

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
  {
    id: "slack",
    vendorName: "Slack",
    description: "Delivers Nudges as interactive DMs; replies feed back into Tier 0 goal response data.",
    purpose: "notification",
    authType: "bot_token",
    requiredScopes: ["chat:write", "users:read.email"],
    syncedMetrics: [],
  },
  {
    id: "microsoft_teams",
    vendorName: "Microsoft Teams",
    description: "Delivers Nudges as Adaptive Card messages; replies feed back into Tier 0 goal response data.",
    purpose: "notification",
    authType: "bot_token",
    requiredScopes: ["User.Read.All"],
    syncedMetrics: [],
  },
];

export function getConnectorDefinition(id: string): ConnectorDefinition | undefined {
  return CONNECTOR_REGISTRY.find((c) => c.id === id);
}
