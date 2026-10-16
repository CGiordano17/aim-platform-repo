-- `connectNotificationProvider` (src/app/(app)/integrations/actions.ts)
-- upserts onto `vendor_name` when an admin connects Slack/Teams — needs a
-- unique constraint to upsert against, which 0001_init.sql never added
-- (it only anticipated inserting rows directly, not upserting by vendor).

alter table public.integrations add constraint integrations_vendor_name_key unique (vendor_name);
