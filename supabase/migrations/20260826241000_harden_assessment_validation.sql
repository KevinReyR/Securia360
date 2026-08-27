create or replace function private.validate_assessment_transition() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='validated' and old.status='completed' and not private.has_permission(new.organization_id,'assessments.validate') then raise exception 'insufficient assessment validation permission' using errcode='42501'; end if;
 if new.status='validated' and old.status<>'completed' then raise exception 'only completed assessments can be validated' using errcode='23514'; end if;
 if new.status='validated' then new.validated_at:=now(); new.validated_by:=(select auth.uid()); end if;
 return new;
end; $$;
revoke all on function private.validate_assessment_transition() from public,anon,authenticated,service_role;
create trigger assessments_validate_transition before update of status on public.assessments for each row execute function private.validate_assessment_transition();
notify pgrst,'reload schema';
