-- Rich classification details (v0.3). Nullable: rows saved before v0.3 have no details
-- and render verdict-only. `details_schema_version` lets the app read older shapes.
alter table public.hotdog_classifications
  add column details jsonb,
  add column details_schema_version smallint;

-- Audit trail for data deletion requests. Deliberately holds no personal data:
-- no visitor/session id and no storage paths — only what happened and how much.
create table public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('single_classification', 'all_visitor_data')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  deleted_classification_count integer not null default 0,
  deleted_file_count integer not null default 0,
  -- Fixed codes only, so free text (which could carry ids or paths) can never be stored.
  failure_reason text check (
    failure_reason in ('storage_delete_failed', 'database_delete_failed', 'unknown', 'abandoned')
  ),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index data_deletion_requests_requested_at_idx
  on public.data_deletion_requests (requested_at desc);

alter table public.data_deletion_requests enable row level security;
