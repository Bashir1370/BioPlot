-- Remote broadcasts are private and restricted to the document owner.
-- Cross-account sharing requires an explicit membership model in a later feature.
begin;
drop policy if exists bioplot_owner_realtime_read on realtime.messages;
create policy bioplot_owner_realtime_read on realtime.messages for select to authenticated
using (exists(select 1 from public.bioplot_projects where user_id=auth.uid() and 'bioplot:'||id=(select realtime.topic())));
drop policy if exists bioplot_owner_realtime_write on realtime.messages;
create policy bioplot_owner_realtime_write on realtime.messages for insert to authenticated
with check (exists(select 1 from public.bioplot_projects where user_id=auth.uid() and 'bioplot:'||id=(select realtime.topic())));
commit;
