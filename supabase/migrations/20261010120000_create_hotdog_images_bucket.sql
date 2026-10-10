-- Private bucket for images users upload to classify.
-- Only the API (service role key, bypasses RLS) reads and writes it; no storage policies
-- means anon/authenticated clients have no access.
-- Limits mirror HOTDOG_IMAGE_MEDIA_TYPE_LIST / HOTDOG_IMAGE_MAX_BYTE_SIZE in @seamflow/shared-types.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hotdog-images',
  'hotdog-images',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;
