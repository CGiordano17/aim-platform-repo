-- Integrations registry (PRD build phase 6, framework only — no vendor
-- chosen, per explicit user decision this session).
--
-- 0001_init.sql's `integrations` table only tracked connection status.
-- PRD §6.2 describes the fuller target: "a connectors table (vendor, auth
-- config, field mappings) + OAuth token storage (encrypted) + a scheduled
-- sync worker per connector." This migration adds the missing columns.
--
-- Token columns stay plaintext-nullable here deliberately: real encryption
-- at rest (Supabase Vault / pgsodium, or an application-layer KMS) is
-- infrastructure to wire up when the first real vendor connector is built
-- — faking encryption now (e.g. reversible encoding mislabeled as
-- "encrypted") would be actively misleading, worse than being explicit
-- that this isn't done yet. No real OAuth flow exists yet either way, so
-- these columns stay null until that work happens.

alter table public.integrations
  add column config jsonb not null default '{}'::jsonb,       -- vendor-specific auth config / field mappings
  add column access_token text,                                -- NOT encrypted yet — see note above
  add column refresh_token text,                                -- NOT encrypted yet — see note above
  add column token_expires_at timestamptz;

comment on column public.integrations.access_token is 'Plaintext placeholder — must be encrypted at rest before any real vendor OAuth flow stores a real token here.';
comment on column public.integrations.refresh_token is 'Plaintext placeholder — must be encrypted at rest before any real vendor OAuth flow stores a real token here.';
