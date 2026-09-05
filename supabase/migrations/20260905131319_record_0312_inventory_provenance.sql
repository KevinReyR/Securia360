-- Record the dedicated provenance path for the Resolution 0312 inventory.
-- The source SHA-256 already lives in each immutable content snapshot.

update public.normative_review_artifacts
set source_path = 'inventario_estandares_resolucion_0312_con_perfiles.xlsx'
where content_snapshot ->> 'source_sha256' =
      'F3700F103B53D03EAB076B185084B5DF0F2D5FFEA463FAD5F25C1BCEBC153C57'
  and source_path is null;

do $$
begin
  if (
    select count(*)
    from public.normative_review_artifacts
    where source_path = 'inventario_estandares_resolucion_0312_con_perfiles.xlsx'
      and content_snapshot ->> 'source_sha256' =
          'F3700F103B53D03EAB076B185084B5DF0F2D5FFEA463FAD5F25C1BCEBC153C57'
  ) <> 154 then
    raise exception 'expected provenance on 154 Resolution 0312 review artifacts';
  end if;
end;
$$;
