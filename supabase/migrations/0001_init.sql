-- AIM Platform — initial schema (PRD §4, build phase 5 migration)
-- Run via `supabase db push` against a linked project, or paste into the SQL
-- editor of a hosted Supabase project. Mirrors
-- docs/PRD-Engineering-Framework.md §4 — keep this file, the PRD, and
-- src/lib/types.ts in sync when any of them change.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Role type (PRD §3) ───────────────────────────────────────────────────────
create type public.app_role as enum ('superadmin', 'hradmin', 'manager', 'viewer');

-- ── Profiles (extends auth.users — real auth via Supabase Auth, resolving the
--    PRD §7 open question: both email/password and SSO are supported) ───────
-- Replaces the prototype's plaintext-passcode `users` table entirely.
-- auth.users holds credentials; this table holds AIM-specific profile data
-- keyed to the same id.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role public.app_role not null default 'viewer',
  department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- New signups get a profile row automatically, defaulted to the
-- lowest-privilege role — an existing superadmin/hradmin promotes them from
-- the Teams tab. Never trust a client-supplied role at signup time.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email, 'viewer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Used throughout the RLS policies below — avoids re-subquerying profiles in
-- every policy and keeps them readable.
create function public.current_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── Questions (PRD §4 Question) ──────────────────────────────────────────────
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  dimension text not null,
  text text not null,
  type text not null check (type in ('likert', 'multiple_choice', 'text')),
  phase text not null check (phase in ('pre', 'post', 'both')),
  options text[],
  option_scores numeric[],
  scoring_prompt text,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Respondents (PRD §4 Respondent) ──────────────────────────────────────────
-- Kept separate from `profiles`: a respondent may not have platform login
-- access (e.g. a one-off survey participant). `profile_id` links the two
-- only when the respondent is also a logged-in platform user.
create table public.respondents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  department text,
  role text,
  level text,
  pre_score jsonb,   -- { trust, willingness, prepFoundations, prepWorkflow, prepTech, overall, custom }
  post_score jsonb,
  pre_segment text,
  post_segment text,
  pathway text,
  completed_pre boolean not null default false,
  completed_post boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Workflows (PRD §4 Workflow) ──────────────────────────────────────────────
-- `tasks` stays JSONB rather than a normalized child table: the Workflows tab
-- UI isn't built yet (tracked in the aim-platform skill's
-- open-decisions-and-artifacts.md), so nothing queries into individual tasks.
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  owner text,
  tasks jsonb not null default '[]'::jsonb,
  status text not null default 'identified' check (status in ('identified', 'augmented', 'piloting', 'standard')),
  usage_rate numeric,
  adoption_threshold numeric,
  compliance_rate numeric,
  linked_goal_ids text[] not null default '{}',
  date_identified date,
  date_augmented date,
  date_scaled date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Interventions (PRD §4 Intervention) ──────────────────────────────────────
create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('training_moment', 'casual_collision', 'sustainment_session', 'role_based_training')),
  format text not null check (format in ('virtual', 'in_person')),
  title text not null,
  description text,
  date date,
  linked_workflow_ids uuid[] not null default '{}',
  linked_department text,
  participants text[] not null default '{}',
  status text not null default 'planned' check (status in ('planned', 'completed')),
  facilitator text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Transformation Goals (PRD §2.4 / §4 TransformationGoal) ──────────────────
-- `id` is a human-readable slug (e.g. 'goal-adoption-pulse') matching the
-- ids already used in prototype/App.jsx's seed data, not a random uuid —
-- keeps the seed script's upserts idempotent and the ids stable across
-- environments. `maturity`, `measures`, and `source_detail` were added to
-- this schema alongside this migration — see PRD §4's changelog note.
create table public.transformation_goals (
  id text primary key,
  title text not null,
  category text not null check (category in ('productivity', 'quality', 'revenue', 'capability')),
  tier smallint not null check (tier between 0 and 3),
  maturity text not null check (maturity in ('literate', 'applied', 'operational', 'transformational')),
  statement jsonb not null, -- { action, resources, outcome }
  measurement_source text not null check (measurement_source in ('nudge', 'manual', 'vendor_api', 'system_api')),
  measures text,
  source_detail text,
  current_value text,
  target_value text,
  unit text,
  linked_workflow_ids uuid[] not null default '{}',
  linked_nudge_ids uuid[] not null default '{}',
  vendor_sources jsonb not null default '[]'::jsonb,        -- [{ name, notes }]
  implementation_steps jsonb not null default '[]'::jsonb,  -- [{ title, detail }]
  roi_example text,
  last_updated timestamptz,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ── Nudges (PRD §4 Nudge — not yet built as a feature; schema reserved now
--    to avoid a later migration. Populated starting build phase 3.) ────────
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  linked_goal_id text references public.transformation_goals(id) on delete set null,
  cadence text not null check (cadence in ('per-completion', 'weekly', 'monthly')),
  target_department text,
  target_role text,
  target_individual_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.nudge_responses (
  id uuid primary key default gen_random_uuid(),
  nudge_id uuid not null references public.nudges(id) on delete cascade,
  respondent_id uuid references public.respondents(id) on delete set null,
  value text not null,
  responded_at timestamptz not null default now()
);

-- ── Integrations (PRD §4 Integration — registry framework only, per build
--    phase 6. Schema reserved now; no vendor connector logic is wired to it
--    yet, and no specific vendor is chosen — see PRD §6.2.) ─────────────────
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null,
  auth_type text not null default 'oauth',
  status text not null default 'disconnected' check (status in ('connected', 'disconnected')),
  scopes text[] not null default '{}',
  connected_at timestamptz,
  last_sync timestamptz,
  synced_metrics text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ── updated_at maintenance ───────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.questions for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.respondents for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.workflows for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.interventions for each row execute procedure public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Edit-rights-within-a-tab for Workflows and Transformation Goals are an open
-- PRD §7 decision. Until that's resolved, policies below match the current
-- prototype's behavior: any authenticated platform user (all 4 roles) can
-- view and edit Goals'/Workflows' editable fields; only superadmin/hradmin
-- manage Questions, other people's Profiles, Respondents, Interventions, and
-- Nudges; only superadmin manages Integrations — matching PRD §3's role table.

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.respondents enable row level security;
alter table public.workflows enable row level security;
alter table public.interventions enable row level security;
alter table public.transformation_goals enable row level security;
alter table public.nudges enable row level security;
alter table public.nudge_responses enable row level security;
alter table public.integrations enable row level security;

create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid());
create policy "profiles_write_admin" on public.profiles for all to authenticated
  using (public.current_role() in ('superadmin', 'hradmin'))
  with check (public.current_role() in ('superadmin', 'hradmin'));

create policy "questions_select_authenticated" on public.questions for select to authenticated using (true);
create policy "questions_insert_admin" on public.questions for insert to authenticated with check (public.current_role() in ('superadmin', 'hradmin'));
create policy "questions_update_admin" on public.questions for update to authenticated using (public.current_role() in ('superadmin', 'hradmin'));
create policy "questions_delete_admin" on public.questions for delete to authenticated using (public.current_role() in ('superadmin', 'hradmin'));

create policy "respondents_select_authenticated" on public.respondents for select to authenticated using (true);
create policy "respondents_write_admin" on public.respondents for all to authenticated
  using (public.current_role() in ('superadmin', 'hradmin'))
  with check (public.current_role() in ('superadmin', 'hradmin'));

create policy "workflows_select_authenticated" on public.workflows for select to authenticated using (true);
create policy "workflows_write_authenticated" on public.workflows for all to authenticated using (true) with check (true);

create policy "interventions_all_admin" on public.interventions for all to authenticated
  using (public.current_role() in ('superadmin', 'hradmin'))
  with check (public.current_role() in ('superadmin', 'hradmin'));

create policy "goals_select_authenticated" on public.transformation_goals for select to authenticated using (true);
create policy "goals_update_authenticated" on public.transformation_goals for update to authenticated using (true) with check (true);
create policy "goals_insert_admin" on public.transformation_goals for insert to authenticated with check (public.current_role() in ('superadmin', 'hradmin'));
create policy "goals_delete_admin" on public.transformation_goals for delete to authenticated using (public.current_role() in ('superadmin', 'hradmin'));

create policy "nudges_all_admin" on public.nudges for all to authenticated
  using (public.current_role() in ('superadmin', 'hradmin'))
  with check (public.current_role() in ('superadmin', 'hradmin'));
create policy "nudge_responses_select_admin" on public.nudge_responses for select to authenticated using (public.current_role() in ('superadmin', 'hradmin'));
create policy "nudge_responses_insert_authenticated" on public.nudge_responses for insert to authenticated with check (true);

create policy "integrations_all_superadmin" on public.integrations for all to authenticated
  using (public.current_role() = 'superadmin')
  with check (public.current_role() = 'superadmin');
