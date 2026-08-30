"use client";

import { useTransition } from "react";
import type { ConnectorDefinition } from "@/lib/integrations/registry";

export interface ConnectedIntegration {
  id: string;
  vendorName: string;
  status: string;
  connectedAt: string | null;
  lastSync: string | null;
  syncedMetrics: string[];
}

export function IntegrationsView({
  connected,
  available,
  onDisconnect,
}: {
  connected: ConnectedIntegration[];
  available: ConnectorDefinition[];
  onDisconnect: (id: string) => Promise<void>;
}) {
  return (
    <div className="px-10 py-9 font-body">
      <div className="mb-8">
        <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">Integrations</h1>
        <p className="text-sm text-hud-sub max-w-2xl">
          OAuth config happens once per vendor here (PRD §6.2), never custom-built per Goal — the sync worker and token
          storage are pre-built infrastructure that any registered connector plugs into.
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
            No connectors are registered yet — <strong className="text-hud-text">no vendor has been chosen</strong>{" "}
            (PRD §6.2/§7 open question). Adding one is a code change in{" "}
            <code className="text-hud-cyan">src/lib/integrations/registry.ts</code>, prioritized by whichever vendor
            the client actually uses first — not a runtime setting, and not something to speculatively build ahead of
            that decision.
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-hud-line">
            {available.map((c) => (
              <div key={c.id} className="bg-hud-panel p-4 flex justify-between items-center">
                <div>
                  <div className="text-[13px] font-medium text-hud-text">{c.vendorName}</div>
                  <div className="text-xs text-hud-sub mt-0.5">{c.description}</div>
                </div>
                {/* Unreachable today — CONNECTOR_REGISTRY is empty. Wiring this
                    button to a real OAuth-start route is part of adding the
                    connector definition itself, not a separate step. */}
                <button className="px-3.5 py-1.5 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-xs cursor-pointer">Connect</button>
              </div>
            ))}
          </div>
        )}
      </div>
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
