-- Tier 1 manual-entry admin forms (PRD build phase 4).
--
-- The generic `transformation_goals.current_value` field (phase 2) covers
-- hand-editing a single scalar, but Tier 1's own mechanism — "manual
-- tagging / expert review" — implies a log of individual review events
-- (see the Tier 1 goals' own implementationSteps in
-- src/lib/data/transformation-goals-seed.ts, e.g. "review a random 10% of
-- outputs weekly, log error type, reviewer, date"), not one overwritten
-- number. This table is that log. A new migration file, not an edit to
-- 0001_init.sql — migrations are append-only once a real project may have
-- already applied the earlier one.

create table public.goal_review_entries (
  id uuid primary key default gen_random_uuid(),
  goal_id text not null references public.transformation_goals(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  note text,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.goal_review_entries enable row level security;

-- Same access shape as transformation_goals: any authenticated role can
-- read (matches "All roles" view in PRD §3); only superadmin/hradmin log
-- entries, since this is expert review, not open editing.
create policy "goal_review_entries_select_authenticated" on public.goal_review_entries for select to authenticated using (true);
create policy "goal_review_entries_insert_admin" on public.goal_review_entries for insert to authenticated
  with check (public.current_role() in ('superadmin', 'hradmin'));
create policy "goal_review_entries_delete_admin" on public.goal_review_entries for delete to authenticated
  using (public.current_role() in ('superadmin', 'hradmin'));
