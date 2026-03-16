create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null check (role in ('admin', 'editor')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  position integer not null default 0,
  enabled boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  data_json jsonb not null default '{}'::jsonb,
  updated_by uuid references public.admin_profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_by uuid references public.admin_profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.admin_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists site_sections_unique_page_section_status
  on public.site_sections(page_key, section_key, status);

create index if not exists site_sections_page_status_position_idx
  on public.site_sections(page_key, status, position);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_on_site_sections on public.site_sections;
create trigger set_updated_at_on_site_sections
before update on public.site_sections
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_site_settings on public.site_settings;
create trigger set_updated_at_on_site_settings
before update on public.site_settings
for each row execute function public.set_updated_at();

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.is_active = true
      and ap.role = 'admin'
  );
$$;

create or replace function public.is_editor_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.is_active = true
      and ap.role in ('admin', 'editor')
  );
$$;

grant execute on function public.is_admin_user() to authenticated;
grant execute on function public.is_editor_user() to authenticated;

create or replace function public.guard_admin_profiles_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin_user() then
    return new;
  end if;

  if old.id <> auth.uid() then
    raise exception 'Only admins can update other profiles.';
  end if;

  if new.email is distinct from old.email
    or new.role is distinct from old.role
    or new.is_active is distinct from old.is_active then
    raise exception 'Only admins can change email, role or active state.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_admin_profiles_update_trigger on public.admin_profiles;
create trigger guard_admin_profiles_update_trigger
before update on public.admin_profiles
for each row execute function public.guard_admin_profiles_update();

alter table public.admin_profiles enable row level security;
alter table public.site_sections enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists admin_profiles_select_self_or_admin on public.admin_profiles;
create policy admin_profiles_select_self_or_admin
on public.admin_profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin_user());

drop policy if exists admin_profiles_insert_admin_only on public.admin_profiles;
create policy admin_profiles_insert_admin_only
on public.admin_profiles
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists admin_profiles_update_self_or_admin on public.admin_profiles;
create policy admin_profiles_update_self_or_admin
on public.admin_profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin_user())
with check (id = auth.uid() or public.is_admin_user());

drop policy if exists admin_profiles_delete_admin_only on public.admin_profiles;
create policy admin_profiles_delete_admin_only
on public.admin_profiles
for delete
to authenticated
using (public.is_admin_user());

drop policy if exists site_sections_read_editor on public.site_sections;
create policy site_sections_read_editor
on public.site_sections
for select
to authenticated
using (public.is_editor_user());

drop policy if exists site_sections_write_editor on public.site_sections;
create policy site_sections_write_editor
on public.site_sections
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists site_settings_read_editor on public.site_settings;
create policy site_settings_read_editor
on public.site_settings
for select
to authenticated
using (public.is_editor_user());

drop policy if exists site_settings_write_admin on public.site_settings;
create policy site_settings_write_admin
on public.site_settings
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists audit_logs_read_admin on public.audit_logs;
create policy audit_logs_read_admin
on public.audit_logs
for select
to authenticated
using (public.is_admin_user());

drop policy if exists audit_logs_insert_editor on public.audit_logs;
create policy audit_logs_insert_editor
on public.audit_logs
for insert
to authenticated
with check (
  public.is_editor_user()
  and (
    actor_id is null
    or actor_id = auth.uid()
    or public.is_admin_user()
  )
);
