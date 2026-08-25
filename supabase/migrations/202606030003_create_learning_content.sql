create table if not exists public.worlds (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    description text not null,
    region_label text not null,
    mascot text not null,
    theme_color text not null,
    accent_color text not null,
    sort_order integer not null check (sort_order >= 0),
    is_published boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.levels (
    id uuid primary key default gen_random_uuid(),
    world_id uuid not null references public.worlds (id) on delete cascade,
    slug text not null,
    title text not null,
    description text not null,
    narrative text not null,
    programming_language text not null default 'javascript',
    difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
    xp_reward integer not null default 100 check (xp_reward > 0),
    stars_reward integer not null default 3 check (stars_reward between 1 and 3),
    sort_order integer not null check (sort_order >= 0),
    starter_code text not null default '',
    validation_rules jsonb not null default '{}'::jsonb,
    is_published boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint levels_world_slug_unique unique (world_id, slug),
    constraint levels_world_sort_order_unique unique (world_id, sort_order)
);

create index if not exists levels_world_id_idx
    on public.levels (world_id);

create index if not exists worlds_sort_order_idx
    on public.worlds (sort_order);

drop trigger if exists handle_worlds_updated_at on public.worlds;
create trigger handle_worlds_updated_at
before update on public.worlds
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists handle_levels_updated_at on public.levels;
create trigger handle_levels_updated_at
before update on public.levels
for each row
execute function public.set_current_timestamp_updated_at();
