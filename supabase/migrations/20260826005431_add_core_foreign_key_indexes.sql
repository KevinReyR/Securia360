-- Cover foreign keys used by joins, integrity checks and delete operations.

create index areas_created_by_idx on public.areas (created_by);
create index areas_updated_by_idx on public.areas (updated_by);
create index areas_parent_fkey_idx
  on public.areas (organization_id, site_id, parent_area_id);

create index legal_entities_created_by_idx on public.legal_entities (created_by);
create index legal_entities_updated_by_idx on public.legal_entities (updated_by);

create index member_roles_created_by_idx on public.member_roles (created_by);
create index member_roles_organization_member_fkey_idx
  on public.member_roles (organization_id, organization_member_id);
create index member_roles_organization_site_fkey_idx
  on public.member_roles (organization_id, site_id);

create index organization_characteristics_created_by_idx
  on public.organization_characteristics (created_by);
create index organization_characteristics_updated_by_idx
  on public.organization_characteristics (updated_by);

create index organizations_updated_by_idx on public.organizations (updated_by);

create index sites_created_by_idx on public.sites (created_by);
create index sites_updated_by_idx on public.sites (updated_by);
create index sites_organization_legal_entity_fkey_idx
  on public.sites (organization_id, legal_entity_id);
