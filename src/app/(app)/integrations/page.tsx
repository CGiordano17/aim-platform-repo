import { createClient } from "@/lib/supabase/server";
import { CONNECTOR_REGISTRY, getConnectorDefinition } from "@/lib/integrations/registry";
import { IntegrationsView, type ConnectedIntegration } from "@/components/integrations/IntegrationsView";
import { disconnectIntegration, connectNotificationProvider } from "./actions";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("integrations").select("id, vendor_name, status, connected_at, last_sync, synced_metrics").eq("status", "connected");

  if (error) {
    return <div className="p-10 text-hud-text font-body text-sm">Couldn&apos;t load integrations: {error.message}</div>;
  }

  // `vendor_name` in the DB is the registry key (e.g. "slack"), not a
  // display string — resolve the pretty name from the registry for
  // anything we have a definition for.
  const connected: ConnectedIntegration[] = (data ?? []).map((row) => ({
    id: row.id,
    providerId: row.vendor_name,
    vendorName: getConnectorDefinition(row.vendor_name)?.vendorName ?? row.vendor_name,
    status: row.status,
    connectedAt: row.connected_at,
    lastSync: row.last_sync,
    syncedMetrics: row.synced_metrics ?? [],
  }));

  const connectedProviderIds = new Set(connected.map((c) => c.providerId));
  const available = CONNECTOR_REGISTRY.filter((c) => !connectedProviderIds.has(c.id));

  return (
    <IntegrationsView connected={connected} available={available} onDisconnect={disconnectIntegration} onConnect={connectNotificationProvider} />
  );
}
