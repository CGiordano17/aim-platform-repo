import { createClient } from "@/lib/supabase/server";
import { CONNECTOR_REGISTRY } from "@/lib/integrations/registry";
import { IntegrationsView, type ConnectedIntegration } from "@/components/integrations/IntegrationsView";
import { disconnectIntegration } from "./actions";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("integrations").select("id, vendor_name, status, connected_at, last_sync, synced_metrics").eq("status", "connected");

  if (error) {
    return <div className="p-10 text-hud-text font-body text-sm">Couldn&apos;t load integrations: {error.message}</div>;
  }

  const connected: ConnectedIntegration[] = (data ?? []).map((row) => ({
    id: row.id,
    vendorName: row.vendor_name,
    status: row.status,
    connectedAt: row.connected_at,
    lastSync: row.last_sync,
    syncedMetrics: row.synced_metrics ?? [],
  }));

  return <IntegrationsView connected={connected} available={CONNECTOR_REGISTRY} onDisconnect={disconnectIntegration} />;
}
