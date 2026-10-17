create table if not exists public.planner_states (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 2000000),
 updated_at timestamptz not null default now()
);
alter table public.planner_states enable row level security;
alter table public.planner_states force row level security;
revoke all on public.planner_states from anon;
grant select, insert, update, delete on public.planner_states to authenticated;
create policy "read own plan" on public.planner_states for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own plan" on public.planner_states for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own plan" on public.planner_states for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own plan" on public.planner_states for delete to authenticated using ((select auth.uid()) = user_id);
