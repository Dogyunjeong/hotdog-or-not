-- Data retention: abandoned temp uploads (picked but never classified, or a failed check that
-- was never retried) may carry GPS metadata, so the daily cleanup deletes them after a day.
-- The Storage API can't filter objects by age, so the API asks Postgres for the stale keys and
-- then deletes them through the Storage API (deleting rows in storage.objects directly would
-- leave the files behind).
create function public.list_stale_hotdog_image_uploads(older_than interval, max_rows integer)
returns table (name text)
language sql
stable
security definer
set search_path = ''
as $$
  select objects.name
  from storage.objects as objects
  where objects.bucket_id = 'hotdog-image-uploads'
    and objects.created_at < now() - older_than
  order by objects.created_at
  limit max_rows;
$$;

-- Only the API (service role) may call it.
revoke execute on function public.list_stale_hotdog_image_uploads(interval, integer)
  from public, anon, authenticated;
grant execute on function public.list_stale_hotdog_image_uploads(interval, integer)
  to service_role;
