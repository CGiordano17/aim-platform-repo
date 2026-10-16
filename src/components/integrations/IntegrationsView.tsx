"use client";

import { useState, useTransition } from "react";
import type { ConnectorDefinition } from "@/lib/integrations/registry";

export interface ConnectedIntegration {
  id: string; // DB row id, used for disconnect
  providerId: string; // the registry key (e.g. "slack") — matches ConnectorDefinition.id
  vendorName: string; // display name, resolved from the registry where possible
  status: string;
  connectedAt: string | null;
  lastSync: string | null;
  syncedMetrics: string[];
}

const PURPOSE_LABEL: Record<ConnectorDefinition["purpose"], string> = {
  notification: "Nudge delivery",
  metrics_sync: "Goal metrics sync",
};

export function IntegrationsView({
  connected,
  available,
  onDisconnect,
  onConnect,
}: {
  connected: ConnectedIntegration[];
  available: ConnectorDefinition[];
  onDisconnect: (id: string) => Promise<void>;
  onConnect: (providerId: string) => Promise<void>;
}) {
  return (
    <div className="px-10 py-9 font-body">
      <div className="mb-8">
        <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">Integrations</h1>
        <p className="text-sm text-hud-sub max-w-2xl">
          OAuth/credential config happens once per vendor here (PRD §6.2), never custom-built per Goal or Nudge — the
          registry is pre-built infrastructure any connector plugs into, whether it delivers Nudges or syncs Goal metrics.
        </p>
      </div>

      <div className="mb-8">
        <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wide mb-3">Connected</div>
        {connected.length === 0 ? (
          <div className="p-6 bg-hud-panel border border-hud-line text-center text-hud-muted text-[13px]">
            Nothing connected yet.
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-hud-line">
            {connected.map((c) => (
              <ConnectedRow key={c.id} integration={c} onDisconnect={onDisconnect} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wide mb-3">Available connectors</div>
        {available.length === 0 ? (
          <div className="p-6 bg-hud-panel border border-hud-line text-[13px] text-hud-sub leading-relaxed">
            Nothing left to connect — or no connector is registered for what you need yet. Adding one is a code change
            in <code className="text-hud-cyan">src/lib/integrations/registry.ts</code>, not a runtime setting. (No
            Tier 2/3 goal-metrics vendor is chosen yet — that&apos;s a separate, still-open decision from Nudge delivery.)
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-hud-line">
            {available.map((c) => (
              <AvailableRow key={c.id} connector={c} onConnect={onConnect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AvailableRow({ connector, onConnect }: { connector: ConnectorDefinition; onConnect: (providerId: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="bg-hud-panel p-4 flex justify-between items-center gap-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-medium text-hud-text">{connector.vendorName}</div>
          <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 border border-hud-line text-hud-muted">{PURPOSE_LABEL[connector.purpose]}</span>
        </div>
        <div className="text-xs text-hud-sub mt-0.5">{connector.description}</div>
        {error && <div className="text-[11px] text-red-400 mt-1">{error}</div>}
      </div>
      <button
        onClick={() =>
          startTransition(async () => {
            setError("");
            try {
              await onConnect(connector.id);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to connect.");
            }
          })
        }
        disabled={isPending}
        className="shrink-0 px-3.5 py-1.5 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-xs cursor-pointer"
      >
        {isPending ? "Testing…" : "Connect"}
      </button>
    </div>
  );
}

function ConnectedRow({ integration, onDisconnect }: { integration: ConnectedIntegration; onDisconnect: (id: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="bg-hud-panel p-4 flex justify-between items-center">
      <div>
        <div className="text-[13px] font-medium text-hud-text">{integration.vendorName}</div>
        <div className="text-xs text-hud-sub mt-0.5">
          {integration.status} · {integration.syncedMetrics.length > 0 ? integration.syncedMetrics.join(", ") : "no metrics synced"}
        </div>
      </div>
      <button
        onClick={() => startTransition(() => onDisconnect(integration.id))}
        disabled={isPending}
        className="px-3.5 py-1.5 bg-transparent border border-hud-line text-hud-sub text-xs cursor-pointer"
      >
        {isPending ? "…" : "Disconnect"}
      </button>
    </div>
  );
}
