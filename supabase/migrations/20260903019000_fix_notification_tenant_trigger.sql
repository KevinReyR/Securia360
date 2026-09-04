-- Fix the notification polymorphic validator so each trigger-table branch only
-- references columns owned by that table. Authorization and tenant rules stay
-- unchanged and no grants are broadened.
create or replace function private.validate_notification_links()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='notification_preferences' then
    if not exists(select 1 from public.organization_members where organization_id=new.organization_id and user_id=new.user_id and status='active') then raise exception 'notification preference requires active membership' using errcode='23514'; end if;
  elsif tg_table_name='notifications' then
    if not exists(select 1 from public.domain_events where id=new.domain_event_id and organization_id=new.organization_id) then raise exception 'notification event belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='notification_deliveries' then
    if not exists(select 1 from public.notifications where id=new.notification_id and organization_id=new.organization_id and channel='email') then raise exception 'notification delivery belongs to another organization' using errcode='23514'; end if;
  end if;
  return new;
end; $$;

revoke all on function private.validate_notification_links() from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
