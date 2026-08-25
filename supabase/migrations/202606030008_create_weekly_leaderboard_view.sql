create or replace view public.leaderboard_weekly as
with weekly_level_progress as (
    select
        progress.user_id,
        sum(level_data.xp_reward)::integer as level_xp,
        count(*)::integer as completed_levels
    from public.user_progress as progress
    inner join public.levels as level_data
        on level_data.id = progress.level_id
    where progress.completion_status = 'completed'
      and progress.completed_at >= date_trunc('week', timezone('utc', now()))
    group by progress.user_id
),
weekly_achievement_progress as (
    select
        achievement_record.user_id,
        sum(achievement_record.awarded_xp)::integer as achievement_xp,
        count(*)::integer as unlocked_achievements
    from public.achievements as achievement_record
    where achievement_record.unlocked_at >= date_trunc('week', timezone('utc', now()))
    group by achievement_record.user_id
),
leaderboard_source as (
    select
        profile_record.id as user_id,
        coalesce(profile_record.username, 'explorador') as username,
        profile_record.avatar_key,
        profile_record.country_code,
        coalesce(weekly_level_progress.level_xp, 0) + coalesce(weekly_achievement_progress.achievement_xp, 0) as weekly_xp,
        coalesce(weekly_level_progress.completed_levels, 0) as completed_levels,
        coalesce(weekly_achievement_progress.unlocked_achievements, 0) as unlocked_achievements
    from public.profiles as profile_record
    left join weekly_level_progress
        on weekly_level_progress.user_id = profile_record.id
    left join weekly_achievement_progress
        on weekly_achievement_progress.user_id = profile_record.id
)
select
    leaderboard_source.user_id,
    leaderboard_source.username,
    leaderboard_source.avatar_key,
    leaderboard_source.country_code,
    leaderboard_source.weekly_xp,
    leaderboard_source.completed_levels,
    leaderboard_source.unlocked_achievements,
    dense_rank() over (
        order by leaderboard_source.weekly_xp desc, leaderboard_source.completed_levels desc, leaderboard_source.username asc
    ) as rank
from leaderboard_source
where leaderboard_source.weekly_xp > 0;

revoke all on public.leaderboard_weekly from public, anon, authenticated;
grant select on public.leaderboard_weekly to authenticated;
