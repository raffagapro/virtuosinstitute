-- Virtuos Institute
-- Migration 017: Single Active Membership Per Profile

begin;

update public.school_memberships memberships
set is_active = false
where memberships.is_active = true
  and memberships.profile_id in (
    select id
    from public.profiles
    where platform_role = 'superadmin'
  );

with ranked_active_memberships as (
  select
    id,
    row_number() over (
      partition by profile_id
      order by
        case when approval_status = 'approved' then 0 else 1 end,
        updated_at desc,
        created_at desc,
        id desc
    ) as rn
  from public.school_memberships
  where is_active = true
)
update public.school_memberships memberships
set is_active = false
from ranked_active_memberships ranked
where memberships.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists school_memberships_single_active_per_profile_idx
  on public.school_memberships (profile_id)
  where is_active = true;

commit;
