-- Do not share trigger records between Copilot tables: copilot_messages has no
-- assistant_message_id, while copilot_sources does.
create or replace function private.validate_copilot_message_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.copilot_conversations c where c.id=new.conversation_id and c.organization_id=new.organization_id) then
    raise exception 'copilot conversation belongs to another organization' using errcode='23514';
  end if;
  return new;
end; $$;
create or replace function private.validate_copilot_source_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.copilot_messages m where m.id=new.assistant_message_id and m.organization_id=new.organization_id and m.role='assistant') then
    raise exception 'copilot source belongs to another organization' using errcode='23514';
  end if;
  return new;
end; $$;
create or replace function private.validate_copilot_proposal_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.copilot_conversations c where c.id=new.conversation_id and c.organization_id=new.organization_id) then
    raise exception 'copilot proposal belongs to another organization' using errcode='23514';
  end if;
  return new;
end; $$;
drop trigger if exists copilot_messages_links on public.copilot_messages;
drop trigger if exists copilot_sources_links on public.copilot_sources;
drop trigger if exists copilot_proposals_links on public.copilot_action_proposals;
create trigger copilot_messages_links before insert or update on public.copilot_messages for each row execute function private.validate_copilot_message_links();
create trigger copilot_sources_links before insert or update on public.copilot_sources for each row execute function private.validate_copilot_source_links();
create trigger copilot_proposals_links before insert or update on public.copilot_action_proposals for each row execute function private.validate_copilot_proposal_links();
revoke all on function private.validate_copilot_message_links() from public,anon,authenticated;
revoke all on function private.validate_copilot_source_links() from public,anon,authenticated;
revoke all on function private.validate_copilot_proposal_links() from public,anon,authenticated;
notify pgrst, 'reload schema';
