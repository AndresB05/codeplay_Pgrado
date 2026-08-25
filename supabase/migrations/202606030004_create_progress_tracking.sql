create table if not exists public.user_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    level_id uuid not null references public.levels (id) on delete cascade,
    completion_status text not null default 'in_progress' check (completion_status in ('in_progress', 'completed')),
    best_score integer not null default 0 check (best_score between 0 and 100),
    stars_earned integer not null default 0 check (stars_earned between 0 and 3),
    attempt_count integer not null default 0 check (attempt_count >= 0),
    completed_at timestamptz,
    last_attempt_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint user_progress_user_level_unique unique (user_id, level_id)
);

create table if not exists public.level_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    level_id uuid not null references public.levels (id) on delete cascade,
    submitted_code text not null,
    is_success boolean not null default false,
    score integer not null default 0 check (score between 0 and 100),
    runtime_ms integer check (runtime_ms is null or runtime_ms >= 0),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_progress_user_id_idx
    on public.user_progress (user_id);

create index if not exists user_progress_level_id_idx
    on public.user_progress (level_id);

create index if not exists level_attempts_user_id_idx
    on public.level_attempts (user_id);

create index if not exists level_attempts_level_id_idx
    on public.level_attempts (level_id);

create index if not exists level_attempts_created_at_idx
    on public.level_attempts (created_at desc);

drop trigger if exists handle_user_progress_updated_at on public.user_progress;

create trigger handle_user_progress_updated_at
before update on public.user_progress
for each row
execute function public.set_current_timestamp_updated_at();
