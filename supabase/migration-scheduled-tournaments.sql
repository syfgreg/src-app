-- Lets the M.O.C. schedule a future tournament without touching the live
-- board — it's activated manually "when the day comes." Idempotent.
alter table public.tournaments add column if not exists scheduled_for timestamptz;
