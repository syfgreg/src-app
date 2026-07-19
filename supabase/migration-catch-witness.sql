-- Adds a required witness (M.O.C. or fellow angler) to trophy / record-breaker /
-- new-species catches. Idempotent.
alter table public.catches add column if not exists witness_id uuid references public.profiles(id);
