create table public.normative_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z][A-Z0-9_]{2,80}$'),
  source_type text not null check (source_type in ('LAW','DECREE','RESOLUTION','CIRCULAR','TECHNICAL_GUIDE','TECHNICAL_STANDARD','INTERNAL_STANDARD')),
  title text not null check (length(btrim(title)) between 3 and 300),
  jurisdiction text not null default 'CO', issuing_authority text,
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.normative_source_versions (
  id uuid primary key default gen_random_uuid(), source_id uuid not null references public.normative_sources(id) on delete restrict,
  version_code text not null check (length(btrim(version_code)) between 1 and 80), official_reference text not null check (length(btrim(official_reference)) between 3 and 300), official_url text,
  effective_from date, effective_to date, status text not null default 'published' check (status in ('draft','published','superseded','repealed')),
  supersedes_version_id uuid references public.normative_source_versions(id) on delete restrict,
  expert_review_status text not null default 'pending' check (expert_review_status in ('pending','reviewed','not_required')),
  interpretive_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(source_id,version_code), check (effective_to is null or effective_from is null or effective_to >= effective_from),
  check (supersedes_version_id is null or supersedes_version_id <> id)
);
create table public.requirements (
  id uuid primary key default gen_random_uuid(), normative_source_version_id uuid not null references public.normative_source_versions(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{1,100}$'), title text not null check (length(btrim(title)) between 3 and 300),
  summary text not null check (length(btrim(summary)) between 3 and 2000), status text not null default 'active' check (status in ('draft','active','archived')),
  expert_review_status text not null default 'pending' check (expert_review_status in ('pending','reviewed','not_required')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(normative_source_version_id,code)
);
create index normative_source_versions_source_effective_idx on public.normative_source_versions(source_id,effective_from desc);
create index requirements_version_status_idx on public.requirements(normative_source_version_id,status);
alter table public.normative_sources enable row level security; alter table public.normative_source_versions enable row level security; alter table public.requirements enable row level security;
grant select on public.normative_sources,public.normative_source_versions,public.requirements to authenticated;
create policy normative_sources_authenticated_read on public.normative_sources for select to authenticated using ((select auth.uid()) is not null);
create policy normative_source_versions_authenticated_read on public.normative_source_versions for select to authenticated using ((select auth.uid()) is not null);
create policy requirements_authenticated_read on public.requirements for select to authenticated using ((select auth.uid()) is not null);
create trigger normative_sources_set_updated_at before update on public.normative_sources for each row execute function private.set_updated_at();
create trigger normative_source_versions_set_updated_at before update on public.normative_source_versions for each row execute function private.set_updated_at();
create trigger requirements_set_updated_at before update on public.requirements for each row execute function private.set_updated_at();
insert into public.normative_sources(code,source_type,title,issuing_authority) values
 ('LEY_1562_2012','LAW','Ley 1562 de 2012','Congreso de Colombia'),('DECRETO_1072_2015','DECREE','Decreto 1072 de 2015','Presidencia de Colombia'),('RESOLUCION_0312_2019','RESOLUTION','Resolución 0312 de 2019','Ministerio del Trabajo'),('GTC_45','TECHNICAL_GUIDE','Guía Técnica Colombiana GTC 45','ICONTEC') on conflict(code) do nothing;
insert into public.normative_source_versions(source_id,version_code,official_reference,effective_from,expert_review_status,interpretive_note)
select id,'2012','Ley 1562 de 2012',date '2012-07-11','pending','Referencia estructural; interpretación funcional pendiente de revisión experta.' from public.normative_sources where code='LEY_1562_2012'
union all select id,'2015','Decreto 1072 de 2015',date '2015-05-26','pending','Referencia estructural; interpretación funcional pendiente de revisión experta.' from public.normative_sources where code='DECRETO_1072_2015'
union all select id,'2019','Resolución 0312 de 2019',date '2019-02-13','pending','Los estándares mínimos se modelarán en su dominio específico.' from public.normative_sources where code='RESOLUCION_0312_2019'
union all select id,'GTC45','GTC 45',date '2012-01-01','pending','La metodología se modelará en risk_methodologies, no como requirements.' from public.normative_sources where code='GTC_45'
on conflict(source_id,version_code) do nothing;
notify pgrst,'reload schema';
