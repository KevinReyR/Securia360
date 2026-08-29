-- Commercial state is intentionally independent from tenant RBAC and RLS.
create table public.saas_admin_roles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null check (role in ('saas_admin','saas_support')),
  status text not null default 'active' check (status in ('active','suspended')),
  granted_by uuid references auth.users(id) on delete set null,
  reason text not null check (length(trim(reason)) >= 3),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.saas_admin_audit (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id) on delete set null,
  action text not null, entity_type text not null, entity_id uuid, before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
alter table public.billing_plans add column version integer not null default 1 check(version > 0);
alter table public.billing_subscriptions add column commercial_note text check(commercial_note is null or length(commercial_note)<=2000);
alter table public.saas_support_sessions add column ended_by uuid references auth.users(id) on delete set null;
create index saas_admin_roles_active_idx on public.saas_admin_roles(user_id) where status='active';

create or replace function private.is_saas_admin(p_support_allowed boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.saas_admin_roles r where r.user_id=auth.uid() and r.status='active' and (r.role='saas_admin' or (p_support_allowed and r.role='saas_support')));
$$;
create or replace function private.prevent_billing_history_mutation() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='billing_plans' and old.status='archived' then raise exception 'archived billing plan is immutable' using errcode='55000'; end if;
 if tg_table_name='billing_usage_periods' and old.period_end <= now() then raise exception 'closed usage period is immutable' using errcode='55000'; end if;
 if tg_table_name='saas_support_sessions' and old.status in ('ended','rejected') then raise exception 'closed support session is immutable' using errcode='55000'; end if;
 return new;
end; $$;
create or replace function private.capture_saas_admin_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.saas_admin_audit(actor_user_id,action,entity_type,entity_id,before_data,after_data)
 values(auth.uid(),tg_op, tg_table_name,(coalesce(to_jsonb(new)->>'user_id',to_jsonb(old)->>'user_id'))::uuid,case when tg_op='INSERT' then null else to_jsonb(old) end,case when tg_op='DELETE' then null else to_jsonb(new) end);
 return coalesce(new,old);
end; $$;
create or replace function public.manage_saas_subscription(p_organization_id uuid,p_plan_id uuid,p_status text,p_trial_ends_at timestamptz,p_period_start timestamptz,p_period_end timestamptz,p_note text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not private.is_saas_admin(false) then raise exception 'saas administration access required' using errcode='42501'; end if;
 if p_status not in ('trialing','active','past_due','suspended','cancelled') or not exists(select 1 from public.billing_plans where id=p_plan_id and status='active') then raise exception 'invalid commercial subscription' using errcode='22023'; end if;
 if p_period_start is not null and (p_period_end is null or p_period_end<=p_period_start) then raise exception 'invalid billing period' using errcode='22023'; end if;
 insert into public.billing_subscriptions(organization_id,billing_plan_id,status,trial_ends_at,current_period_start,current_period_end,commercial_note)
 values(p_organization_id,p_plan_id,p_status,p_trial_ends_at,p_period_start,p_period_end,nullif(left(trim(coalesce(p_note,'')),2000),''))
 on conflict(organization_id) do update set billing_plan_id=excluded.billing_plan_id,status=excluded.status,trial_ends_at=excluded.trial_ends_at,current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,commercial_note=excluded.commercial_note,updated_at=now()
 returning id into v_id; return v_id;
end; $$;
create or replace function public.manage_saas_support_session(p_organization_id uuid,p_action text,p_reason text,p_session_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not private.is_saas_admin(true) or length(trim(coalesce(p_reason,'')))<3 then raise exception 'invalid support operation' using errcode='42501'; end if;
 if p_action='request' then insert into public.saas_support_sessions(organization_id,reinova_admin_user_id,reason,status) values(p_organization_id,auth.uid(),trim(p_reason),'requested') returning id into v_id;
 elsif p_action='start' then update public.saas_support_sessions set status='active',started_at=now() where id=p_session_id and status='requested' returning id into v_id;
 elsif p_action='end' then update public.saas_support_sessions set status='ended',ended_at=now(),ended_by=auth.uid() where id=p_session_id and status='active' returning id into v_id;
 else raise exception 'unsupported support action' using errcode='22023'; end if;
 if v_id is null then raise exception 'support session transition is invalid' using errcode='23514'; end if; return v_id;
end; $$;

alter table public.saas_admin_roles enable row level security;
alter table public.saas_admin_audit enable row level security;
revoke all on public.billing_plans,public.billing_subscriptions,public.billing_usage_periods,public.billing_webhook_events,public.saas_support_sessions,public.saas_admin_roles from anon,authenticated;
grant select on public.billing_plans,public.billing_subscriptions,public.billing_usage_periods,public.saas_support_sessions to authenticated;
create policy saas_admin_roles_self on public.saas_admin_roles for select to authenticated using(user_id=auth.uid() or private.is_saas_admin(false));
create policy saas_admin_audit_read on public.saas_admin_audit for select to authenticated using(private.is_saas_admin(false));
drop policy if exists billing_subscriptions_read on public.billing_subscriptions;
create policy billing_subscriptions_read on public.billing_subscriptions for select to authenticated using(private.has_permission(organization_id,'billing.read') or private.is_saas_admin(true));
drop policy if exists billing_usage_read on public.billing_usage_periods;
create policy billing_usage_read on public.billing_usage_periods for select to authenticated using(private.has_permission(organization_id,'billing.read') or private.is_saas_admin(true));
drop policy if exists support_sessions_read on public.saas_support_sessions;
create policy support_sessions_read on public.saas_support_sessions for select to authenticated using(private.has_permission(organization_id,'billing.read') or private.is_saas_admin(true));

create trigger billing_plan_immutable before update on public.billing_plans for each row execute function private.prevent_billing_history_mutation();
create trigger billing_usage_immutable before update or delete on public.billing_usage_periods for each row execute function private.prevent_billing_history_mutation();
create trigger support_session_immutable before update on public.saas_support_sessions for each row execute function private.prevent_billing_history_mutation();
create trigger saas_admin_roles_audit after insert or update on public.saas_admin_roles for each row execute function private.capture_saas_admin_audit();
create trigger billing_plans_audit after insert or update on public.billing_plans for each row execute function private.capture_core_audit();

revoke all on function private.is_saas_admin(boolean),private.prevent_billing_history_mutation(),private.capture_saas_admin_audit() from public,anon,authenticated,service_role;
revoke all on function public.manage_saas_subscription(uuid,uuid,text,timestamptz,timestamptz,timestamptz,text),public.manage_saas_support_session(uuid,text,text,uuid) from public,anon;
grant execute on function public.manage_saas_subscription(uuid,uuid,text,timestamptz,timestamptz,timestamptz,text),public.manage_saas_support_session(uuid,text,text,uuid) to authenticated;
insert into public.saas_admin_roles(user_id,role,status,granted_by,reason)
select id,'saas_admin','active',id,'Administrador interno inicial de Reinova Labs.' from auth.users where lower(email)='kevinreinosor@gmail.com' and email_confirmed_at is not null
on conflict(user_id) do nothing;
notify pgrst,'reload schema';
