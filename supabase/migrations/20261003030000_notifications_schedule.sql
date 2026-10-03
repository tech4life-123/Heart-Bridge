-- HeartBridge: schedule the email worker. Applied live as `notifications_schedule`.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Every 5 minutes ask the app to send waiting emails. The secret is read from app_settings at run time.
select cron.schedule(
  'heartbridge-notify',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://heartbridge-liberia-software-production-corporation.vercel.app/api/cron/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select value #>> '{}' from public.app_settings where key = 'notify_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $job$
);
