alter table public.profiles enable row level security;
alter table public.worlds enable row level security;
alter table public.levels enable row level security;
alter table public.user_progress enable row level security;
alter table public.level_attempts enable row level security;
alter table public.achievements enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists worlds_read_published on public.worlds;
create policy worlds_read_published
on public.worlds
for select
to anon, authenticated
using (is_published = true);

drop policy if exists levels_read_published on public.levels;
create policy levels_read_published
on public.levels
for select
to anon, authenticated
using (is_published = true);

drop policy if exists user_progress_select_own on public.user_progress;
create policy user_progress_select_own
on public.user_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists level_attempts_select_own on public.level_attempts;
create policy level_attempts_select_own
on public.level_attempts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists achievements_select_own on public.achievements;
create policy achievements_select_own
on public.achievements
for select
to authenticated
using (auth.uid() = user_id);

revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.user_progress from anon, authenticated;
revoke insert, update, delete on public.level_attempts from anon, authenticated;
revoke insert, update, delete on public.achievements from anon, authenticated;

revoke all on public.worlds from public;
revoke all on public.levels from public;
revoke all on public.profiles from public;
revoke all on public.user_progress from public;
revoke all on public.level_attempts from public;
revoke all on public.achievements from public;

grant select on public.worlds to anon, authenticated;
grant select on public.levels to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.user_progress to authenticated;
grant select on public.level_attempts to authenticated;
grant select on public.achievements to authenticated;
