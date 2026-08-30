// The Integrations Registry pattern (PRD §6.2, build phase 6): OAuth config
// happens once per vendor HERE, not custom-built per Goal/feature. The
// admin Integrations tab is just a list view over whatever's registered in
// this array plus the `public.integrations` table's connected instances.
//
// This array is intentionally empty — no vendor has been chosen (open
// question, PRD §6.2/§7). Adding a real connector is a code change here,
// not a runtime configuration step: define a ConnectorDefinition, push it
// below, and the Integrations tab picks it up automatically.
//
// A real connector's startOAuth would redirect to the vendor's OAuth
// consent screen and its callback route would exchange the code, store
// the (encrypted — see 0003_integrations_registry.sql's column comments)
// tokens in `public.integrations`, and sync would run on a schedule
// (e.g. a Vercel Cron Job hitting a Route Handler) pulling whatever
// metrics that vendor exposes into the relevant TransformationGoal rows.

export interface ConnectorDefinition {
  id: string;
  vendorName: string;
  description: string;
  authType: "oauth";
  requiredScopes: string[];
  /** Metric names this connector can sync into TransformationGoal.currentValue. */
  syncedMetrics: string[];
}

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [];

export function getConnectorDefinition(id: string): ConnectorDefinition | undefined {
  return CONNECTOR_REGISTRY.find((c) => c.id === id);
}
