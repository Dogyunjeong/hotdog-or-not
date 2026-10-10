-- Temp bucket the browser uploads into via signed upload URLs.
-- The API validates, classifies, then moves objects to `hotdog-images`.
-- Limits mirror HOTDOG_IMAGE_MEDIA_TYPE_LIST / HOTDOG_IMAGE_MAX_BYTE_SIZE in shared/types/hotdog.
-- TODO: scheduled cleanup of abandoned objects older than 1 day.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hotdog-image-uploads',
  'hotdog-image-uploads',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;
