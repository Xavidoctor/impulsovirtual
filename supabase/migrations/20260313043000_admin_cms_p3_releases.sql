create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  snapshot_json jsonb not null,
  notes text,
  published_by uuid references public.admin_profiles(id),
  published_at timestamptz not null default now()
);

create index if not exists releases_published_at_desc_idx
  on public.releases(published_at desc);

alter table public.releases enable row level security;

drop policy if exists releases_read_editor on public.releases;
create policy releases_read_editor
on public.releases
for select
to authenticated
using (public.is_editor_user());

drop policy if exists releases_write_admin on public.releases;
create policy releases_write_admin
on public.releases
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
