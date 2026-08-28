-- Objective, versioned training assessment. Scores are calculated only in PostgreSQL.
create table public.training_evaluation_templates (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 training_catalog_id uuid not null references public.training_catalog(id) on delete restrict,
 version_number integer not null check(version_number>0), title text not null check(btrim(title)<>''), passing_percent numeric(5,2) not null check(passing_percent between 0 and 100),
 status text not null default 'draft' check(status in ('draft','published','archived')), created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(training_catalog_id,version_number)
);
create table public.training_evaluation_questions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, template_id uuid not null references public.training_evaluation_templates(id) on delete restrict,
 prompt text not null check(length(btrim(prompt)) between 3 and 2000), weight numeric(8,2) not null check(weight>0), display_order integer not null check(display_order>=0), created_at timestamptz not null default now(), unique(template_id,display_order)
);
create table public.training_evaluation_options (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, question_id uuid not null references public.training_evaluation_questions(id) on delete restrict,
 label text not null check(length(btrim(label)) between 1 and 1000), is_correct boolean not null default false, display_order integer not null check(display_order>=0), unique(question_id,display_order)
);
create table public.training_evaluation_responses (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, training_evaluation_id uuid not null references public.training_evaluations(id) on delete restrict,
 question_id uuid not null references public.training_evaluation_questions(id) on delete restrict, option_id uuid not null references public.training_evaluation_options(id) on delete restrict, selected_at timestamptz not null default now(), unique(training_evaluation_id,question_id)
);
alter table public.training_evaluations add column template_id uuid references public.training_evaluation_templates(id) on delete restrict, add column status text not null default 'draft' check(status in ('draft','graded','voided')), add column scoring_snapshot jsonb not null default '{}'::jsonb check(jsonb_typeof(scoring_snapshot)='object');
alter table public.training_catalog add column default_passing_percent numeric(5,2) not null default 70 check(default_passing_percent between 0 and 100);

create index training_templates_catalog_status_idx on public.training_evaluation_templates(organization_id,training_catalog_id,status);
create index training_questions_template_idx on public.training_evaluation_questions(template_id,display_order);
create index training_options_question_idx on public.training_evaluation_options(question_id,display_order);
create index training_responses_evaluation_idx on public.training_evaluation_responses(training_evaluation_id);
insert into public.permissions(code,module,action,description) values ('training.participants','training','participants','Consultar detalle nominal de participantes de capacitación.') on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.code='training.participants' where r.code='organization_admin' and r.organization_id is null on conflict do nothing;

create or replace function private.validate_training_assessment_links() returns trigger language plpgsql security definer set search_path='' as $$
declare org_id uuid;
begin
 if tg_table_name='training_evaluation_templates' then select organization_id into org_id from public.training_catalog where id=new.training_catalog_id;
 elsif tg_table_name='training_evaluation_questions' then select organization_id into org_id from public.training_evaluation_templates where id=new.template_id;
 elsif tg_table_name='training_evaluation_options' then select organization_id into org_id from public.training_evaluation_questions where id=new.question_id;
 elsif tg_table_name='training_evaluation_responses' then
   if not exists(select 1 from public.training_evaluations e join public.training_evaluation_questions q on q.id=new.question_id join public.training_evaluation_options o on o.id=new.option_id where e.id=new.training_evaluation_id and e.organization_id=new.organization_id and q.organization_id=new.organization_id and o.question_id=q.id and o.organization_id=new.organization_id) then raise exception 'training answer belongs to another tenant or question' using errcode='23514'; end if; return new;
 end if;
 if org_id is null or org_id<>new.organization_id then raise exception 'training assessment link belongs to another organization' using errcode='23514'; end if;
 return new;
end; $$;
revoke all on function private.validate_training_assessment_links() from public,anon,authenticated,service_role;

create or replace function private.grade_training_evaluation(p_enrollment_id uuid,p_template_id uuid,p_answers jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare e public.training_enrollments%rowtype; t public.training_evaluation_templates%rowtype; evaluator uuid:=(select auth.uid()); total numeric:=0; earned numeric:=0; evaluation_id uuid; certificate_id uuid; catalog_validity integer; answer jsonb; q public.training_evaluation_questions%rowtype;
begin
 if evaluator is null then raise exception 'authentication required' using errcode='42501'; end if;
 select * into e from public.training_enrollments where id=p_enrollment_id for update; if not found then raise exception 'training enrollment not found' using errcode='P0002'; end if;
 if not private.has_permission(e.organization_id,'training.validate') then raise exception 'training validation permission required' using errcode='42501'; end if;
 if not exists(select 1 from public.training_attendances where training_enrollment_id=e.id and status='present') then raise exception 'certificate requires present attendance' using errcode='23514'; end if;
 select * into t from public.training_evaluation_templates where id=p_template_id and organization_id=e.organization_id and status='published'; if not found then raise exception 'published evaluation template required' using errcode='23514'; end if;
 if exists(select 1 from public.training_evaluations where training_enrollment_id=e.id and status='graded') then raise exception 'training evaluation already graded' using errcode='23505'; end if;
 if jsonb_typeof(p_answers)<>'array' then raise exception 'answers must be an array' using errcode='22023'; end if;
 select coalesce(sum(weight),0) into total from public.training_evaluation_questions where template_id=t.id;
 if total=0 or jsonb_array_length(p_answers)<>(select count(*) from public.training_evaluation_questions where template_id=t.id) then raise exception 'all template questions must be answered' using errcode='23514'; end if;
 insert into public.training_evaluations(organization_id,training_enrollment_id,template_id,score,maximum_score,passed,status,evaluated_by,evaluated_at,scoring_snapshot)
 values(e.organization_id,e.id,t.id,0,100,false,'draft',evaluator,now(),jsonb_build_object('template_id',t.id,'version',t.version_number,'passing_percent',t.passing_percent)) returning id into evaluation_id;
 for answer in select value from jsonb_array_elements(p_answers) loop
   select * into q from public.training_evaluation_questions where id=(answer->>'question_id')::uuid and template_id=t.id;
   if not found or not exists(select 1 from public.training_evaluation_options o where o.id=(answer->>'option_id')::uuid and o.question_id=q.id) then raise exception 'invalid answer option' using errcode='23514'; end if;
   insert into public.training_evaluation_responses(organization_id,training_evaluation_id,question_id,option_id) values(e.organization_id,evaluation_id,q.id,(answer->>'option_id')::uuid);
   if exists(select 1 from public.training_evaluation_options where id=(answer->>'option_id')::uuid and is_correct) then earned:=earned+q.weight; end if;
 end loop;
 update public.training_evaluations set score=round(100*earned/total,2),maximum_score=100,passed=(100*earned/total)>=t.passing_percent,status='graded',scoring_snapshot=scoring_snapshot||jsonb_build_object('earned_weight',earned,'total_weight',total) where id=evaluation_id;
 if exists(select 1 from public.training_evaluations where id=evaluation_id and passed) then
   select c.validity_days into catalog_validity from public.training_sessions s left join public.training_catalog c on c.id=s.training_catalog_id where s.id=e.training_session_id;
   insert into public.training_certificates(organization_id,training_enrollment_id,certificate_code,issued_at,expires_at,issued_by) values(e.organization_id,e.id,'TRN-'||to_char(current_date,'YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),current_date,case when catalog_validity is null then null else current_date+catalog_validity end,evaluator) returning id into certificate_id;
 end if;
 return coalesce(certificate_id,evaluation_id);
end; $$;
revoke all on function private.grade_training_evaluation(uuid,uuid,jsonb) from public,anon;
grant execute on function private.grade_training_evaluation(uuid,uuid,jsonb) to authenticated;
create or replace function public.grade_training_evaluation(p_enrollment_id uuid,p_template_id uuid,p_answers jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.grade_training_evaluation(p_enrollment_id,p_template_id,p_answers); $$;
revoke all on function public.grade_training_evaluation(uuid,uuid,jsonb) from public,anon;
grant execute on function public.grade_training_evaluation(uuid,uuid,jsonb) to authenticated;

alter table public.training_evaluation_templates enable row level security; alter table public.training_evaluation_questions enable row level security; alter table public.training_evaluation_options enable row level security; alter table public.training_evaluation_responses enable row level security;
grant select,insert,update on public.training_evaluation_templates,public.training_evaluation_questions,public.training_evaluation_options to authenticated;
grant select on public.training_evaluation_responses to authenticated;
create policy training_templates_read on public.training_evaluation_templates for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_templates_write on public.training_evaluation_templates for all to authenticated using((select private.has_permission(organization_id,'training.manage'))) with check((select private.has_permission(organization_id,'training.manage')));
create policy training_questions_read on public.training_evaluation_questions for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_questions_write on public.training_evaluation_questions for all to authenticated using((select private.has_permission(organization_id,'training.manage'))) with check((select private.has_permission(organization_id,'training.manage')));
create policy training_options_read on public.training_evaluation_options for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_options_write on public.training_evaluation_options for all to authenticated using((select private.has_permission(organization_id,'training.manage'))) with check((select private.has_permission(organization_id,'training.manage')));
create policy training_responses_privacy_read on public.training_evaluation_responses for select to authenticated using(exists(select 1 from public.training_evaluations e join public.training_enrollments en on en.id=e.training_enrollment_id join public.organization_members m on m.id=en.organization_member_id where e.id=training_evaluation_id and (private.has_permission(e.organization_id,'training.validate') or private.has_permission(e.organization_id,'training.manage') or private.has_permission(e.organization_id,'training.participants') or m.user_id=(select auth.uid()))));

drop policy if exists training_enrollments_read on public.training_enrollments; drop policy if exists training_attendances_read on public.training_attendances; drop policy if exists training_evaluations_read on public.training_evaluations; drop policy if exists training_certificates_read on public.training_certificates;
create policy training_enrollments_privacy_read on public.training_enrollments for select to authenticated using((select private.has_permission(organization_id,'training.manage')) or (select private.has_permission(organization_id,'training.validate')) or (select private.has_permission(organization_id,'training.participants')) or exists(select 1 from public.organization_members m where m.id=organization_member_id and m.user_id=(select auth.uid())));
create policy training_attendances_privacy_read on public.training_attendances for select to authenticated using(exists(select 1 from public.training_enrollments e join public.organization_members m on m.id=e.organization_member_id where e.id=training_enrollment_id and (private.has_permission(training_attendances.organization_id,'training.manage') or private.has_permission(training_attendances.organization_id,'training.validate') or private.has_permission(training_attendances.organization_id,'training.participants') or m.user_id=(select auth.uid()))));
create policy training_evaluations_privacy_read on public.training_evaluations for select to authenticated using(exists(select 1 from public.training_enrollments e join public.organization_members m on m.id=e.organization_member_id where e.id=training_enrollment_id and (private.has_permission(training_evaluations.organization_id,'training.manage') or private.has_permission(training_evaluations.organization_id,'training.validate') or private.has_permission(training_evaluations.organization_id,'training.participants') or m.user_id=(select auth.uid()))));
create policy training_certificates_privacy_read on public.training_certificates for select to authenticated using(exists(select 1 from public.training_enrollments e join public.organization_members m on m.id=e.organization_member_id where e.id=training_enrollment_id and (private.has_permission(training_certificates.organization_id,'training.manage') or private.has_permission(training_certificates.organization_id,'training.validate') or private.has_permission(training_certificates.organization_id,'training.participants') or m.user_id=(select auth.uid()))));
revoke insert,update,delete on public.training_evaluations,public.training_certificates from authenticated;
drop policy if exists training_evaluations_insert on public.training_evaluations; drop policy if exists training_certificates_insert on public.training_certificates;
create trigger training_templates_links before insert or update on public.training_evaluation_templates for each row execute function private.validate_training_assessment_links();
create trigger training_questions_links before insert or update on public.training_evaluation_questions for each row execute function private.validate_training_assessment_links();
create trigger training_options_links before insert or update on public.training_evaluation_options for each row execute function private.validate_training_assessment_links();
create trigger training_responses_links before insert on public.training_evaluation_responses for each row execute function private.validate_training_assessment_links();
create trigger training_templates_audit after insert or update on public.training_evaluation_templates for each row execute function private.capture_core_audit();
create trigger training_questions_audit after insert or update on public.training_evaluation_questions for each row execute function private.capture_core_audit();
create trigger training_options_audit after insert or update on public.training_evaluation_options for each row execute function private.capture_core_audit();
notify pgrst,'reload schema';
