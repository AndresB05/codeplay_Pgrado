create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text,
    full_name text not null default '',
    avatar_key text not null default 'colibri',
    country_code text not null default 'CO',
    total_xp integer not null default 0 check (total_xp >= 0),
    current_streak integer not null default 0 check (current_streak >= 0),
    max_streak integer not null default 0 check (max_streak >= 0),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint profiles_username_format check (
        username is null
        or username ~ '^[a-z0-9_]{3,30}$'
    )
);

create unique index if not exists profiles_username_unique_idx
    on public.profiles (lower(username))
    where username is not null;

create index if not exists profiles_total_xp_idx
    on public.profiles (total_xp desc);

drop trigger if exists handle_profiles_updated_at on public.profiles;

create trigger handle_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_current_timestamp_updated_at();
