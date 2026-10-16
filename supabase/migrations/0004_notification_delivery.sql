-- Push-notification delivery infrastructure for Nudges — the real UX this
-- was always meant to have: a nudge should reach someone in Slack/Teams
-- organically, not require them to log into the web app and find a widget.
--
-- Vendor-agnostic by design: `provider` is just a string key. Slack and
-- Microsoft Teams are the two concrete implementations (src/lib/notifications/),
-- chosen specifically instead of Google Chat — most enterprises already run
-- one of these two, and plenty explicitly avoid Google. Any future vendor
-- is a new provider implementation + a new allowed `provider` value, nothing
-- else here changes.

-- ── Identity mapping ─────────────────────────────────────────────────────────
-- Resolved automatically server-side the first time a nudge needs to reach
-- someone (email -> Slack/Teams user lookup), cached here. Deliberately NOT
-- a user-facing "connect your account" step — that would reintroduce the
-- "go to a website first" friction this whole feature exists to remove.
create table public.notification_identities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('slack', 'microsoft_teams')),
  external_user_id text not null,   -- Slack user ID, or Teams/AAD object ID
  external_team_id text,            -- Slack workspace/team ID, or Teams tenant ID
  resolved_at timestamptz not null default now(),
  unique (profile_id, provider)
);

-- ── Per-person delivery + response tracking ──────────────────────────────────
-- Separate from `nudge_responses` (which is the respondent-facing answer
-- value already used by the Dashboard widget / submitNudgeResponse) — this
-- tracks the delivery attempt itself: who it was sent to, through which
-- channel, whether it succeeded, and when (if ever) they responded. One
-- nudge fans out to many of these.
create table public.nudge_deliveries (
  id uuid primary key default gen_random_uuid(),
  nudge_id uuid not null references public.nudges(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  provider text not null check (provider in ('slack', 'microsoft_teams')),
  external_message_id text,   -- Slack message ts, or Teams activity/conversation id — needed to correlate the webhook reply back to this row
  status text not null default 'sent' check (status in ('sent', 'failed', 'responded')),
  error text,
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  response_value text
);

create index nudge_deliveries_nudge_id_idx on public.nudge_deliveries (nudge_id);
create index nudge_deliveries_external_message_id_idx on public.nudge_deliveries (external_message_id);

-- Tracks when a weekly/monthly nudge last actually fired, so the dispatcher
-- (src/lib/notifications/dispatch.ts, run on a Vercel Cron schedule) knows
-- what's due without a separate scheduling table.
alter table public.nudges add column last_dispatched_at timestamptz;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Neither table gets a write policy for the `authenticated` role at all —
-- these are written exclusively by trusted server-only code (the cron
-- dispatcher and the Slack/Teams webhook handlers) using the service-role
-- admin client, the same "trusted server-only" pattern scripts/seed.ts and
-- src/lib/anthropic.ts already use. A webhook request is authenticated by
-- its vendor signature (Slack's HMAC, Teams' Bot Framework JWT), not by a
-- Supabase session, so RLS has nothing to check it against anyway.
alter table public.notification_identities enable row level security;
alter table public.nudge_deliveries enable row level security;

create policy "notification_identities_select_admin" on public.notification_identities for select to authenticated
  using (public.current_role() in ('superadmin', 'hradmin'));

create policy "nudge_deliveries_select_admin" on public.nudge_deliveries for select to authenticated
  using (public.current_role() in ('superadmin', 'hradmin'));
