-- Private customer provisioning: a platform administrator can create an
-- organization, its commercial subscription and its first tenant administrator
-- without becoming a member of that tenant.

alter table public.organizations
  add column if not exists code text;

alter table public.organizations
  add constraint organizations_code_format_check
  check (code is null or code ~ '^[A-Z0-9][A-Z0-9_-]{1,29}$');

create unique index if not exists organizations_code_key
  on public.organizations (code)
  where code is not null;

create or replace function private.prevent_admin_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_role_code text;
  new_role_code text;
  target_organization_id uuid;
  old_assignment_global boolean := false;
  new_assignment_global boolean := false;
  provisioning boolean := current_setting('securia.saas_provisioning', true) = '1';
begin
  if coalesce((select auth.jwt() ->> 'role'), '') = 'service_role' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_organization_id := old.organization_id;
    old_assignment_global := old.site_id is null;
    select r.code into old_role_code from public.roles r where r.id = old.role_id;
  else
    target_organization_id := new.organization_id;
    new_assignment_global := new.site_id is null;
    select r.code into new_role_code from public.roles r where r.id = new.role_id;
    if tg_op = 'UPDATE' then
      old_assignment_global := old.site_id is null;
      select r.code into old_role_code from public.roles r where r.id = old.role_id;
    end if;
  end if;

  if ((old_role_code = 'organization_admin' and old_assignment_global)
      or (new_role_code = 'organization_admin' and new_assignment_global))
     and not private.is_global_organization_admin(target_organization_id)
     and not (tg_op = 'INSERT' and provisioning and private.is_saas_admin(false)) then
    raise exception 'only a global organization administrator can manage organization_admin' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.provision_saas_customer(
  p_code text,
  p_name text,
  p_administrator_user_id uuid,
  p_plan_version_id uuid,
  p_status text,
  p_trial_ends_at timestamptz default null,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null,
  p_customer_reference text default null,
  p_subscription_reference text default null,
  p_note text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_membership_id uuid;
  v_plan_id uuid;
  v_admin_role_id uuid;
  v_code text := upper(trim(coalesce(p_code, '')));
  v_name text := trim(coalesce(p_name, ''));
begin
  if not private.is_saas_admin(false) then
    raise exception 'saas administration access required' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9][A-Z0-9_-]{1,29}$' or length(v_name) not between 2 and 160
     or p_administrator_user_id is null
     or p_status not in ('trialing','active','past_due','suspended','cancelled') then
    raise exception 'invalid customer provisioning data' using errcode = '22023';
  end if;
  if p_status = 'trialing' and p_trial_ends_at is null then
    raise exception 'trial end is required' using errcode = '22023';
  end if;
  if p_period_start is not null and (p_period_end is null or p_period_end <= p_period_start) then
    raise exception 'invalid billing period' using errcode = '22023';
  end if;
  select billing_plan_id into v_plan_id
  from public.billing_plan_versions
  where id = p_plan_version_id and status = 'published';
  if v_plan_id is null or not exists (select 1 from auth.users where id = p_administrator_user_id) then
    raise exception 'published plan version and administrator are required' using errcode = '23514';
  end if;

  insert into public.organizations(name, slug, code, country_code, timezone, status, settings)
  values (
    v_name,
    lower(replace(replace(v_code, '-', '-dash-'), '_', '-underscore-')),
    v_code, 'CO', 'America/Bogota', 'active', '{}'::jsonb
  )
  returning id into v_organization_id;

  insert into public.organization_members(organization_id, user_id, status)
  values (v_organization_id, p_administrator_user_id, 'invited')
  returning id into v_membership_id;

  select id into v_admin_role_id
  from public.roles where organization_id is null and code = 'organization_admin';
  if v_admin_role_id is null then
    raise exception 'organization administrator role is unavailable';
  end if;
  perform set_config('securia.saas_provisioning', '1', true);
  insert into public.member_roles(organization_id, organization_member_id, role_id, created_by)
  values (v_organization_id, v_membership_id, v_admin_role_id, auth.uid());

  insert into public.billing_subscriptions(
    organization_id, billing_plan_id, billing_plan_version_id, status, trial_ends_at,
    current_period_start, current_period_end, provider_customer_reference,
    provider_subscription_reference, commercial_note
  ) values (
    v_organization_id, v_plan_id, p_plan_version_id, p_status, p_trial_ends_at,
    p_period_start, p_period_end, nullif(left(trim(coalesce(p_customer_reference, '')), 160), ''),
    nullif(left(trim(coalesce(p_subscription_reference, '')), 160), ''),
    nullif(left(trim(coalesce(p_note, '')), 2000), '')
  );

  insert into public.saas_admin_audit(actor_user_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'customer.provisioned', 'organization', v_organization_id,
    jsonb_build_object('code', v_code, 'administrator_user_id', p_administrator_user_id, 'plan_version_id', p_plan_version_id));
  return v_organization_id;
end;
$$;

revoke all on function public.provision_saas_customer(text,text,uuid,uuid,text,timestamptz,timestamptz,timestamptz,text,text,text)
  from public, anon;
grant execute on function public.provision_saas_customer(text,text,uuid,uuid,text,timestamptz,timestamptz,timestamptz,text,text,text)
  to authenticated;

notify pgrst, 'reload schema';
