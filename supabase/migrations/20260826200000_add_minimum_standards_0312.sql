create table public.minimum_standards (
 id uuid primary key default gen_random_uuid(), normative_source_version_id uuid not null references public.normative_source_versions(id) on delete restrict,
 code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{1,100}$'), functional_description text not null check (length(btrim(functional_description)) between 3 and 2000),
 phva_cycle text not null check (phva_cycle in ('PLAN','DO','CHECK','ACT')), criterion text, expected_evidence text,
 effective_from date, effective_to date, status text not null default 'draft' check(status in ('draft','active','archived')), expert_review_status text not null default 'pending' check(expert_review_status in ('pending','reviewed','not_required')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(normative_source_version_id,code), check(effective_to is null or effective_from is null or effective_to >= effective_from)
);
create table public.standard_profiles (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Z0-9_]{3,80}$'), name text not null check(length(btrim(name)) between 3 and 180), description text, status text not null default 'draft' check(status in ('draft','active','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.standard_profile_versions (
 id uuid primary key default gen_random_uuid(), standard_profile_id uuid not null references public.standard_profiles(id) on delete restrict, version_code text not null,
 effective_from date, effective_to date, status text not null default 'draft' check(status in ('draft','published','superseded','archived')), expert_review_status text not null default 'pending' check(expert_review_status in ('pending','reviewed')),
 supersedes_version_id uuid references public.standard_profile_versions(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(standard_profile_id,version_code), check(effective_to is null or effective_from is null or effective_to >= effective_from)
);
create table public.profile_standards (
 id uuid primary key default gen_random_uuid(), standard_profile_version_id uuid not null references public.standard_profile_versions(id) on delete restrict, minimum_standard_id uuid not null references public.minimum_standards(id) on delete restrict,
 weight numeric(5,2) not null check(weight > 0 and weight <= 100), created_at timestamptz not null default now(), unique(standard_profile_version_id,minimum_standard_id)
);
create index minimum_standards_source_version_idx on public.minimum_standards(normative_source_version_id,status); create index profile_standards_profile_idx on public.profile_standards(standard_profile_version_id);
create or replace function private.validate_standard_profile_publication() returns trigger language plpgsql security definer set search_path='' as $$
declare total numeric; reviewed boolean;
begin
 if new.status='published' and old.status is distinct from 'published' then
  select coalesce(sum(ps.weight),0), coalesce(bool_and(ms.expert_review_status='reviewed'),false) into total,reviewed from public.profile_standards ps join public.minimum_standards ms on ms.id=ps.minimum_standard_id where ps.standard_profile_version_id=new.id;
  if total <> 100 or not reviewed then raise exception 'published standard profile requires reviewed standards with weights totaling 100' using errcode='23514'; end if;
 end if; return new;
end; $$;
revoke all on function private.validate_standard_profile_publication() from public,anon,authenticated,service_role;
alter table public.minimum_standards enable row level security; alter table public.standard_profiles enable row level security; alter table public.standard_profile_versions enable row level security; alter table public.profile_standards enable row level security;
grant select on public.minimum_standards,public.standard_profiles,public.standard_profile_versions,public.profile_standards to authenticated;
create policy minimum_standards_read on public.minimum_standards for select to authenticated using ((select auth.uid()) is not null);
create policy standard_profiles_read on public.standard_profiles for select to authenticated using ((select auth.uid()) is not null);
create policy standard_profile_versions_read on public.standard_profile_versions for select to authenticated using ((select auth.uid()) is not null);
create policy profile_standards_read on public.profile_standards for select to authenticated using ((select auth.uid()) is not null);
create trigger minimum_standards_updated before update on public.minimum_standards for each row execute function private.set_updated_at(); create trigger standard_profiles_updated before update on public.standard_profiles for each row execute function private.set_updated_at(); create trigger standard_profile_versions_updated before update on public.standard_profile_versions for each row execute function private.set_updated_at(); create trigger standard_profile_versions_validate before update of status on public.standard_profile_versions for each row execute function private.validate_standard_profile_publication();
insert into public.standard_profiles(code,name,description,status) values ('RES_0312_INITIAL_REVIEW','Perfil inicial Resolución 0312','Estructura de carga pendiente de revisión experta; no constituye clasificación automática.','draft') on conflict(code) do nothing;
insert into public.standard_profile_versions(standard_profile_id,version_code,status,expert_review_status) select id,'INITIAL_REVIEW','draft','pending' from public.standard_profiles where code='RES_0312_INITIAL_REVIEW' on conflict(standard_profile_id,version_code) do nothing;
notify pgrst,'reload schema';
