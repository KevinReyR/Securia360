-- ETAPA 35: explicit deny policies for internal queues; they remain inaccessible through Data API.
create policy billing_webhook_events_no_direct_access on public.billing_webhook_events for all to authenticated using(false) with check(false);
create policy notification_deliveries_no_direct_access on public.notification_deliveries for all to authenticated using(false) with check(false);
notify pgrst,'reload schema';
