-- The initial content hash is stable but an arbitrary MD5 UUID may not carry an
-- RFC version nibble. Normalize it to a deterministic, UUID-v5-shaped value so
-- strict clients can validate it without changing the natural identity.
with normalized as (
  select id as old_id,
         (
           substr(hash_value, 1, 8) || '-' ||
           substr(hash_value, 9, 4) || '-' ||
           '5' || substr(hash_value, 14, 3) || '-' ||
           '8' || substr(hash_value, 18, 3) || '-' ||
           substr(hash_value, 21, 12)
         )::uuid as new_id
  from (
    select id,
           md5(catalog_version_id::text || '|' || display_code || '|' || risk_class::text || '|' || activity) as hash_value
    from public_catalog.economic_activity_catalog_entries
  ) hashes
)
update public_catalog.economic_activity_catalog_entries entries
set id = normalized.new_id
from normalized
where entries.id = normalized.old_id
  and entries.id <> normalized.new_id;

do $$
begin
  if exists (
    select 1
    from public_catalog.economic_activity_catalog_entries
    where substr(replace(id::text, '-', ''), 13, 1) <> '5'
  ) then
    raise exception 'Economic activity identifiers must use a deterministic UUID v5 marker';
  end if;
end;
$$;
