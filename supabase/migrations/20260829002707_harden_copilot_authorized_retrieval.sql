-- Copilot is an authorized-retrieval ledger, never an autonomous executor.
create table public.copilot_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  conversation_id uuid not null references public.copilot_conversations(id) on delete restrict,
  user_message_id uuid not null references public.copilot_messages(id) on delete restrict,
  assistant_message_id uuid references public.copilot_messages(id) on delete restrict,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null check (provider = 'openai'),
  model text not null check (length(model) between 1 and 120),
  status text not null check (status in ('pending','completed','failed','blocked')),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  provider_response_id text check (provider_response_id is null or length(provider_response_id) <= 160),
  error_code text check (error_code is null or length(error_code) <= 120),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (conversation_id, user_message_id)
);

alter table public.copilot_sources
  add column source_label text not null default 'Fuente autorizada' check (length(source_label) <= 240),
  add column source_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(source_snapshot) = 'object');
alter table public.copilot_action_proposals
  add column decision_note text check (decision_note is null or length(decision_note) <= 2000);

create index copilot_runs_actor_created_idx on public.copilot_runs (organization_id, actor_user_id, created_at desc);
create index copilot_sources_message_created_idx on public.copilot_sources (assistant_message_id, created_at);

alter table public.copilot_runs enable row level security;
revoke all on public.copilot_conversations, public.copilot_messages, public.copilot_sources, public.copilot_action_proposals, public.copilot_runs from anon, authenticated;
grant select on public.copilot_conversations, public.copilot_messages, public.copilot_sources, public.copilot_action_proposals, public.copilot_runs to authenticated;

drop policy if exists copilot_conversations_own on public.copilot_conversations;
create policy copilot_conversations_own on public.copilot_conversations for select to authenticated using (actor_user_id = (select auth.uid()));
drop policy if exists copilot_messages_own on public.copilot_messages;
create policy copilot_messages_own on public.copilot_messages for select to authenticated using (exists (select 1 from public.copilot_conversations c where c.id = conversation_id and c.actor_user_id = (select auth.uid())));
drop policy if exists copilot_sources_own on public.copilot_sources;
create policy copilot_sources_own on public.copilot_sources for select to authenticated using (exists (select 1 from public.copilot_messages m join public.copilot_conversations c on c.id = m.conversation_id where m.id = assistant_message_id and c.actor_user_id = (select auth.uid())));
drop policy if exists copilot_proposals_read on public.copilot_action_proposals;
drop policy if exists copilot_proposals_write on public.copilot_action_proposals;
create policy copilot_proposals_own on public.copilot_action_proposals for select to authenticated using (exists (select 1 from public.copilot_conversations c where c.id = conversation_id and c.actor_user_id = (select auth.uid())));
create policy copilot_runs_own on public.copilot_runs for select to authenticated using (actor_user_id = (select auth.uid()));

create or replace function private.copilot_actor_can(p_organization_id uuid, p_permission text)
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and private.has_permission(p_organization_id, p_permission);
$$;
revoke all on function private.copilot_actor_can(uuid,text) from public, anon, authenticated, service_role;

create or replace function public.create_copilot_conversation(p_organization_id uuid, p_title text default null)
returns public.copilot_conversations language plpgsql security definer set search_path='' as $$
declare v_row public.copilot_conversations;
begin
  if not private.copilot_actor_can(p_organization_id, 'copilot.read') then raise exception 'copilot access denied' using errcode='42501'; end if;
  insert into public.copilot_conversations(organization_id, actor_user_id, title)
  values (p_organization_id, auth.uid(), nullif(left(trim(coalesce(p_title,'')),160),'')) returning * into v_row;
  return v_row;
end; $$;

create or replace function public.record_copilot_user_message(p_conversation_id uuid, p_content text, p_prompt_injection_flag boolean default false)
returns public.copilot_messages language plpgsql security definer set search_path='' as $$
declare v_conversation public.copilot_conversations; v_row public.copilot_messages;
begin
  select * into v_conversation from public.copilot_conversations where id=p_conversation_id and actor_user_id=auth.uid();
  if not found or not private.copilot_actor_can(v_conversation.organization_id, 'copilot.read') then raise exception 'copilot access denied' using errcode='42501'; end if;
  if length(trim(coalesce(p_content,''))) = 0 then raise exception 'message content is required' using errcode='23514'; end if;
  insert into public.copilot_messages(organization_id,conversation_id,actor_user_id,role,content,prompt_injection_flag)
  values(v_conversation.organization_id,p_conversation_id,auth.uid(),'user',left(trim(p_content),8000),p_prompt_injection_flag) returning * into v_row;
  update public.copilot_conversations set updated_at=now() where id=p_conversation_id;
  return v_row;
end; $$;

create or replace function public.record_copilot_response(
  p_conversation_id uuid, p_user_message_id uuid, p_content text, p_prompt_injection_flag boolean,
  p_provider text, p_model text, p_status text, p_request_hash text, p_provider_response_id text,
  p_error_code text, p_sources jsonb default '[]'::jsonb)
returns public.copilot_messages language plpgsql security definer set search_path='' as $$
declare v_conversation public.copilot_conversations; v_user public.copilot_messages; v_assistant public.copilot_messages; v_source jsonb;
begin
  select * into v_conversation from public.copilot_conversations where id=p_conversation_id and actor_user_id=auth.uid();
  if not found or not private.copilot_actor_can(v_conversation.organization_id, 'copilot.read') then raise exception 'copilot access denied' using errcode='42501'; end if;
  select * into v_user from public.copilot_messages where id=p_user_message_id and conversation_id=p_conversation_id and role='user';
  if not found then raise exception 'copilot message does not belong to conversation' using errcode='23514'; end if;
  insert into public.copilot_messages(organization_id,conversation_id,role,content,prompt_injection_flag)
  values(v_conversation.organization_id,p_conversation_id,'assistant',left(trim(coalesce(p_content,'No fue posible generar una respuesta segura.')),8000),p_prompt_injection_flag) returning * into v_assistant;
  insert into public.copilot_runs(organization_id,conversation_id,user_message_id,assistant_message_id,actor_user_id,provider,model,status,request_hash,provider_response_id,error_code,completed_at)
  values(v_conversation.organization_id,p_conversation_id,p_user_message_id,v_assistant.id,auth.uid(),p_provider,left(p_model,120),p_status,p_request_hash,nullif(left(coalesce(p_provider_response_id,''),160),''),nullif(left(coalesce(p_error_code,''),120),''),now());
  for v_source in select value from jsonb_array_elements(coalesce(p_sources,'[]'::jsonb)) loop
    if coalesce(v_source->>'source_type','') not in ('document_version','normative_source_version','requirement','assessment','risk') then raise exception 'unsupported copilot source' using errcode='23514'; end if;
    insert into public.copilot_sources(organization_id,assistant_message_id,source_type,source_id,source_version_id,excerpt,source_label,source_snapshot)
    values(v_conversation.organization_id,v_assistant.id,v_source->>'source_type',(v_source->>'source_id')::uuid,nullif(v_source->>'source_version_id','')::uuid,
      nullif(left(v_source->>'excerpt',1000),''),left(coalesce(v_source->>'source_label','Fuente autorizada'),240),coalesce(v_source->'source_snapshot','{}'::jsonb));
  end loop;
  update public.copilot_conversations set updated_at=now() where id=p_conversation_id;
  return v_assistant;
end; $$;

create or replace function public.create_copilot_proposal(p_conversation_id uuid, p_proposal_type text, p_proposal jsonb)
returns public.copilot_action_proposals language plpgsql security definer set search_path='' as $$
declare v_conversation public.copilot_conversations; v_row public.copilot_action_proposals;
begin
  select * into v_conversation from public.copilot_conversations where id=p_conversation_id and actor_user_id=auth.uid();
  if not found or not private.copilot_actor_can(v_conversation.organization_id, 'copilot.manage') then raise exception 'copilot proposal access denied' using errcode='42501'; end if;
  if p_proposal_type not in ('draft_task','draft_action','draft_document','critical_classification','critical_approval','legal_or_medical') or jsonb_typeof(p_proposal) <> 'object' then raise exception 'invalid copilot proposal' using errcode='23514'; end if;
  insert into public.copilot_action_proposals(organization_id,conversation_id,proposal_type,proposal,proposed_by) values(v_conversation.organization_id,p_conversation_id,p_proposal_type,p_proposal,auth.uid()) returning * into v_row;
  return v_row;
end; $$;

create or replace function public.decide_copilot_proposal(p_proposal_id uuid, p_status text, p_decision_note text)
returns public.copilot_action_proposals language plpgsql security definer set search_path='' as $$
declare v_row public.copilot_action_proposals;
begin
  select p.* into v_row from public.copilot_action_proposals p join public.copilot_conversations c on c.id=p.conversation_id where p.id=p_proposal_id and c.actor_user_id=auth.uid();
  if not found or not private.copilot_actor_can(v_row.organization_id, 'copilot.manage') then raise exception 'copilot proposal access denied' using errcode='42501'; end if;
  if v_row.status <> 'pending_human_confirmation' or p_status not in ('accepted','rejected') or length(trim(coalesce(p_decision_note,'')))=0 then raise exception 'invalid proposal decision' using errcode='23514'; end if;
  if p_status='accepted' and v_row.proposal_type in ('critical_classification','critical_approval','legal_or_medical') and not private.copilot_actor_can(v_row.organization_id, 'copilot.confirm_critical') then raise exception 'human confirmation permission required' using errcode='42501'; end if;
  update public.copilot_action_proposals set status=p_status, decision_note=left(trim(p_decision_note),2000), reviewed_by=auth.uid(), reviewed_at=now() where id=p_proposal_id returning * into v_row;
  return v_row;
end; $$;

revoke all on function public.create_copilot_conversation(uuid,text), public.record_copilot_user_message(uuid,text,boolean), public.record_copilot_response(uuid,uuid,text,boolean,text,text,text,text,text,text,jsonb), public.create_copilot_proposal(uuid,text,jsonb), public.decide_copilot_proposal(uuid,text,text) from public, anon;
grant execute on function public.create_copilot_conversation(uuid,text), public.record_copilot_user_message(uuid,text,boolean), public.record_copilot_response(uuid,uuid,text,boolean,text,text,text,text,text,text,jsonb), public.create_copilot_proposal(uuid,text,jsonb), public.decide_copilot_proposal(uuid,text,text) to authenticated;
create trigger copilot_runs_audit after insert or update on public.copilot_runs for each row execute function private.capture_core_audit();
notify pgrst, 'reload schema';
