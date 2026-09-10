begin;

-- Client users must not have table-wide UPDATE access
-- to profiles because privileged fields such as `plan`
-- live in the same table.

revoke update
on table public.profiles
from authenticated;


-- Normal users may only change safe profile preferences.

grant update (
  display_name,
  preferred_language
)
on table public.profiles
to authenticated;


-- Defense in depth:
-- even if broader UPDATE permissions are accidentally
-- granted later, authenticated browser clients cannot
-- promote their own subscription/role.

create or replace function public.prevent_client_profile_plan_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_role text;
begin
  request_role := auth.role();

  if
    new.plan is distinct from old.plan
    and request_role is not null
    and request_role <> 'service_role'
  then
    raise exception
      'BioPlot profile plan is server-managed';
  end if;

  return new;
end;
$$;


drop trigger if exists protect_profile_plan
on public.profiles;


create trigger protect_profile_plan
before update of plan
on public.profiles
for each row
execute function public.prevent_client_profile_plan_change();


revoke execute
on function public.prevent_client_profile_plan_change()
from public, anon, authenticated;

commit;
