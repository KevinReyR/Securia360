revoke all on function public.list_automation_event_candidates(uuid,integer), public.request_automation_dry_run(uuid,uuid), public.retry_automation_execution(uuid) from public, anon;
grant execute on function public.list_automation_event_candidates(uuid,integer), public.request_automation_dry_run(uuid,uuid), public.retry_automation_execution(uuid) to authenticated;
notify pgrst, 'reload schema';
