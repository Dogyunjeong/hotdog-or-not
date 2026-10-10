-- Anonymous visitor identity, carried by the httpOnly `hotdog_or_not_visitor_session` cookie.
-- `id` is the bearer secret and never leaves the cookie. Storage paths use
-- `storage_folder_id` instead, because signed URLs and temp paths are visible to the browser.
create table public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  storage_folder_id uuid not null unique default gen_random_uuid(),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- One row per classified image; `image_path` points into the `hotdog-images` bucket.
create table public.hotdog_classifications (
  id uuid primary key default gen_random_uuid(),
  visitor_session_id uuid not null references public.visitor_sessions (id) on delete cascade,
  image_path text not null unique,
  is_hotdog boolean not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index hotdog_classifications_visitor_session_id_created_at_idx
  on public.hotdog_classifications (visitor_session_id, created_at desc);

-- Only the API (service role, bypasses RLS) touches these tables.
-- No policies: anon/authenticated keys have no access.
alter table public.visitor_sessions enable row level security;
alter table public.hotdog_classifications enable row level security;
