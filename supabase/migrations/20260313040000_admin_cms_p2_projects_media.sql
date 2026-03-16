create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  excerpt text,
  body_markdown text,
  year integer,
  client_name text,
  category text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  seo_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_by uuid references public.admin_profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  role text not null check (role in ('cover', 'hero', 'gallery', 'detail')),
  storage_key text not null unique,
  public_url text not null,
  alt_text text,
  caption text,
  width integer,
  height integer,
  duration_seconds numeric,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint project_media_alt_required_for_cover_hero
    check (
      role not in ('cover', 'hero')
      or (
        alt_text is not null
        and length(trim(alt_text)) > 0
      )
    )
);

create index if not exists projects_status_updated_at_idx
  on public.projects(status, updated_at desc);

create index if not exists projects_featured_updated_at_idx
  on public.projects(featured, updated_at desc);

create index if not exists project_media_project_sort_idx
  on public.project_media(project_id, sort_order, created_at);

drop trigger if exists set_updated_at_on_projects on public.projects;
create trigger set_updated_at_on_projects
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_media enable row level security;

drop policy if exists projects_read_editor on public.projects;
create policy projects_read_editor
on public.projects
for select
to authenticated
using (public.is_editor_user());

drop policy if exists projects_write_editor on public.projects;
create policy projects_write_editor
on public.projects
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists project_media_read_editor on public.project_media;
create policy project_media_read_editor
on public.project_media
for select
to authenticated
using (public.is_editor_user());

drop policy if exists project_media_write_editor on public.project_media;
create policy project_media_write_editor
on public.project_media
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());
