create table if not exists public.achievements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    achievement_key text not null,
    title text not null,
    description text not null,
    icon_name text not null,
    awarded_xp integer not null default 0 check (awarded_xp >= 0),
    unlocked_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    constraint achievements_user_key_unique unique (user_id, achievement_key)
);

create index if not exists achievements_user_id_idx
    on public.achievements (user_id);

create index if not exists achievements_unlocked_at_idx
    on public.achievements (unlocked_at desc);
