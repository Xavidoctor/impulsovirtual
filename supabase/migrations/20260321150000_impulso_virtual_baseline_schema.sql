begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('admin', 'editor');
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum (
      'new',
      'contacted',
      'qualified',
      'closed_won',
      'closed_lost',
      'spam'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'quote_request_status') then
    create type public.quote_request_status as enum (
      'new',
      'contacted',
      'qualified',
      'proposal_sent',
      'closed_won',
      'closed_lost'
    );
  end if;
end $$;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.admin_role not null default 'editor',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_profiles_id_user_id_match check (id = user_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.admin_profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  short_description text not null,
  full_description text not null,
  cover_image_url text,
  icon_name text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client_name text,
  excerpt text not null default '',
  description text,
  challenge text,
  solution text,
  results text,
  cover_image_url text,
  website_url text,
  featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
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
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  role text,
  quote text not null,
  avatar_url text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  category_id uuid references public.blog_categories(id) on delete set null,
  author_name text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  company text,
  service_interest text,
  message text not null,
  source text,
  status public.lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  company text,
  project_type text,
  requested_services text[] not null default '{}'::text[],
  budget_range text,
  deadline text,
  project_summary text not null,
  "references" text,
  status public.quote_request_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  hero_title text,
  hero_subtitle text,
  hero_cta_primary text,
  hero_cta_secondary text,
  contact_email text,
  contact_phone text,
  whatsapp_url text,
  location text,
  linkedin_url text,
  instagram_url text,
  behance_url text,
  default_seo_title text,
  default_seo_description text,
  default_og_image_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_panel_settings (
  id uuid primary key default gen_random_uuid(),
  contact_notification_email text not null,
  contact_notifications_enabled boolean not null default true,
  contact_auto_reply_enabled boolean not null default false,
  contact_auto_reply_subject text not null,
  contact_auto_reply_body text not null,
  alerts_enabled boolean not null default true,
  vercel_plan text not null default 'sin definir',
  supabase_plan text not null default 'sin definir',
  r2_plan_mode text not null default 'sin definir',
  email_provider text not null default 'resend',
  usage_warning_threshold integer not null default 70,
  usage_danger_threshold integer not null default 85,
  email_daily_limit integer,
  email_monthly_limit integer,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_assets (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  kind text not null check (kind in ('image', 'video')),
  storage_key text not null unique,
  public_url text not null unique,
  content_type text not null,
  file_size bigint,
  width integer,
  height integer,
  duration_seconds numeric,
  alt_text text,
  tags text[] not null default '{}'::text[],
  created_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  visitor_id text not null,
  event_type text not null check (
    event_type in ('page_view', 'project_view', 'cta_click', 'contact_form_view', 'contact_form_submit')
  ),
  path text not null,
  page_title text,
  referrer text,
  device_type text,
  country text,
  browser text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  value_json jsonb not null default '{}'::jsonb
);

create table if not exists public.analytics_daily_rollups (
  date date primary key,
  page_views integer not null default 0,
  unique_visitors integer not null default 0,
  sessions integer not null default 0,
  contacts integer not null default 0,
  cta_clicks integer not null default 0,
  conversion_rate numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_monthly_rollups (
  month date primary key,
  page_views integer not null default 0,
  unique_visitors integer not null default 0,
  sessions integer not null default 0,
  contacts integer not null default 0,
  cta_clicks integer not null default 0,
  conversion_rate numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  platform text not null check (platform in ('vercel', 'supabase', 'cloudflare_r2', 'email')),
  metric_key text not null,
  metric_value numeric not null default 0,
  metric_unit text not null,
  period_start timestamptz,
  period_end timestamptz,
  bucket_or_project text,
  source text not null default 'manual',
  meta_json jsonb not null default '{}'::jsonb
);

create table if not exists public.platform_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  platform text not null check (platform in ('vercel', 'supabase', 'cloudflare_r2', 'email')),
  metric_key text not null,
  severity text not null check (severity in ('verde', 'amarillo', 'naranja', 'rojo')),
  threshold_percent numeric not null,
  current_percent numeric not null,
  status text not null default 'abierta' check (status in ('abierta', 'resuelta')),
  message text not null,
  help_copy text not null
);

create unique index if not exists site_settings_singleton_idx
  on public.site_settings ((true));

create unique index if not exists admin_panel_settings_singleton_idx
  on public.admin_panel_settings ((true));

create index if not exists audit_logs_created_at_idx
  on public.audit_logs(created_at desc);

create index if not exists services_published_sort_idx
  on public.services(is_published, featured desc, sort_order asc, created_at desc);

create index if not exists projects_published_sort_idx
  on public.projects(is_published, featured desc, published_at desc nulls last, created_at desc);

create index if not exists project_media_project_sort_idx
  on public.project_media(project_id, sort_order asc, created_at asc);

create index if not exists testimonials_published_sort_idx
  on public.testimonials(is_published, is_featured desc, sort_order asc, created_at desc);

create index if not exists faqs_published_sort_idx
  on public.faqs(is_published, sort_order asc, created_at desc);

create index if not exists blog_posts_published_idx
  on public.blog_posts(is_published, is_featured desc, published_at desc nulls last);

create index if not exists blog_posts_category_idx
  on public.blog_posts(category_id, published_at desc nulls last);

create index if not exists leads_status_created_idx
  on public.leads(status, created_at desc);

create index if not exists leads_email_created_idx
  on public.leads(email, created_at desc);

create index if not exists quote_requests_status_created_idx
  on public.quote_requests(status, created_at desc);

create index if not exists quote_requests_email_created_idx
  on public.quote_requests(email, created_at desc);

create index if not exists cms_assets_kind_created_idx
  on public.cms_assets(kind, created_at desc);

create index if not exists cms_assets_filename_idx
  on public.cms_assets(filename);

create index if not exists analytics_events_created_idx
  on public.analytics_events(created_at desc);

create index if not exists analytics_events_type_created_idx
  on public.analytics_events(event_type, created_at desc);

create index if not exists analytics_events_path_created_idx
  on public.analytics_events(path, created_at desc);

create index if not exists analytics_events_session_idx
  on public.analytics_events(session_id);

create index if not exists platform_usage_snapshots_platform_created_idx
  on public.platform_usage_snapshots(platform, created_at desc);

create index if not exists platform_usage_snapshots_metric_created_idx
  on public.platform_usage_snapshots(metric_key, created_at desc);

create index if not exists platform_alerts_platform_created_idx
  on public.platform_alerts(platform, created_at desc);

create index if not exists platform_alerts_status_idx
  on public.platform_alerts(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_admin_profile_ids()
returns trigger
language plpgsql
as $$
begin
  if new.id is null and new.user_id is not null then
    new.id = new.user_id;
  end if;

  if new.user_id is null and new.id is not null then
    new.user_id = new.id;
  end if;

  if new.id is null or new.user_id is null then
    raise exception 'admin_profiles.id and admin_profiles.user_id are required';
  end if;

  new.user_id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_admin_profile_ids_trigger on public.admin_profiles;
create trigger sync_admin_profile_ids_trigger
before insert or update on public.admin_profiles
for each row execute function public.sync_admin_profile_ids();

drop trigger if exists set_updated_at_on_services on public.services;
create trigger set_updated_at_on_services
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_projects on public.projects;
create trigger set_updated_at_on_projects
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_blog_categories on public.blog_categories;
create trigger set_updated_at_on_blog_categories
before update on public.blog_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_blog_posts on public.blog_posts;
create trigger set_updated_at_on_blog_posts
before update on public.blog_posts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_leads on public.leads;
create trigger set_updated_at_on_leads
before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_quote_requests on public.quote_requests;
create trigger set_updated_at_on_quote_requests
before update on public.quote_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_site_settings on public.site_settings;
create trigger set_updated_at_on_site_settings
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_admin_panel_settings on public.admin_panel_settings;
create trigger set_updated_at_on_admin_panel_settings
before update on public.admin_panel_settings
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
    where (ap.id = auth.uid() or ap.user_id = auth.uid())
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
    where (ap.id = auth.uid() or ap.user_id = auth.uid())
      and ap.is_active = true
      and ap.role in ('admin', 'editor')
  );
$$;

grant execute on function public.is_admin_user() to authenticated;
grant execute on function public.is_editor_user() to authenticated;

create or replace function public.refresh_analytics_rollups(
  p_from date default (current_date - interval '400 day')::date
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_from date;
begin
  if not (public.is_admin_user() or auth.role() = 'service_role') then
    raise exception 'forbidden';
  end if;

  v_from := coalesce(p_from, (current_date - interval '400 day')::date);

  delete from public.analytics_daily_rollups where date >= v_from;

  insert into public.analytics_daily_rollups (
    date,
    page_views,
    unique_visitors,
    sessions,
    contacts,
    cta_clicks,
    conversion_rate,
    updated_at
  )
  with days as (
    select generate_series(v_from, current_date, interval '1 day')::date as d
  ),
  event_daily as (
    select
      (created_at at time zone 'utc')::date as d,
      count(*) filter (where event_type = 'page_view')::int as page_views,
      count(distinct visitor_id)::int as unique_visitors,
      count(distinct session_id)::int as sessions,
      count(*) filter (where event_type = 'cta_click')::int as cta_clicks
    from public.analytics_events
    where (created_at at time zone 'utc')::date >= v_from
    group by 1
  ),
  lead_daily as (
    select
      (created_at at time zone 'utc')::date as d,
      count(*)::int as contacts
    from public.leads
    where (created_at at time zone 'utc')::date >= v_from
    group by 1
  )
  select
    days.d as date,
    coalesce(event_daily.page_views, 0),
    coalesce(event_daily.unique_visitors, 0),
    coalesce(event_daily.sessions, 0),
    coalesce(lead_daily.contacts, 0),
    coalesce(event_daily.cta_clicks, 0),
    case
      when coalesce(event_daily.unique_visitors, 0) > 0
        then round((coalesce(lead_daily.contacts, 0)::numeric / event_daily.unique_visitors::numeric) * 100, 4)
      else 0
    end as conversion_rate,
    now()
  from days
  left join event_daily on event_daily.d = days.d
  left join lead_daily on lead_daily.d = days.d;

  delete from public.analytics_monthly_rollups
  where month >= date_trunc('month', v_from)::date;

  insert into public.analytics_monthly_rollups (
    month,
    page_views,
    unique_visitors,
    sessions,
    contacts,
    cta_clicks,
    conversion_rate,
    updated_at
  )
  select
    date_trunc('month', d.date)::date as month,
    sum(d.page_views)::int,
    sum(d.unique_visitors)::int,
    sum(d.sessions)::int,
    sum(d.contacts)::int,
    sum(d.cta_clicks)::int,
    case
      when sum(d.unique_visitors) > 0
        then round((sum(d.contacts)::numeric / sum(d.unique_visitors)::numeric) * 100, 4)
      else 0
    end as conversion_rate,
    now()
  from public.analytics_daily_rollups d
  where d.date >= v_from
  group by 1;
end;
$$;

create or replace function public.get_database_size_bytes()
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not (public.is_admin_user() or auth.role() = 'service_role') then
    raise exception 'forbidden';
  end if;

  return pg_database_size(current_database())::bigint;
end;
$$;

create or replace function public.get_storage_usage_summary()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  v_bytes bigint;
  v_objects bigint;
begin
  if not (public.is_admin_user() or auth.role() = 'service_role') then
    raise exception 'forbidden';
  end if;

  select
    coalesce(
      sum(
        case
          when (o.metadata ->> 'size') ~ '^[0-9]+$' then (o.metadata ->> 'size')::bigint
          else 0
        end
      ),
      0
    )::bigint,
    count(*)::bigint
  into v_bytes, v_objects
  from storage.objects o;

  return jsonb_build_object(
    'bytes', v_bytes,
    'objects', v_objects
  );
end;
$$;

create or replace function public.get_monthly_active_users_estimate()
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not (public.is_admin_user() or auth.role() = 'service_role') then
    raise exception 'forbidden';
  end if;

  return (
    select count(*)::bigint
    from auth.users u
    where coalesce(u.last_sign_in_at, u.created_at) >= date_trunc('month', now())
  );
end;
$$;

grant execute on function public.refresh_analytics_rollups(date) to authenticated;
grant execute on function public.get_database_size_bytes() to authenticated;
grant execute on function public.get_storage_usage_summary() to authenticated;
grant execute on function public.get_monthly_active_users_estimate() to authenticated;

alter table public.admin_profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.leads enable row level security;
alter table public.quote_requests enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_panel_settings enable row level security;
alter table public.cms_assets enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_daily_rollups enable row level security;
alter table public.analytics_monthly_rollups enable row level security;
alter table public.platform_usage_snapshots enable row level security;
alter table public.platform_alerts enable row level security;

drop policy if exists admin_profiles_select_self_or_admin on public.admin_profiles;
create policy admin_profiles_select_self_or_admin
on public.admin_profiles
for select
to authenticated
using (id = auth.uid() or user_id = auth.uid() or public.is_admin_user());

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
using (id = auth.uid() or user_id = auth.uid() or public.is_admin_user())
with check (id = auth.uid() or user_id = auth.uid() or public.is_admin_user());

drop policy if exists admin_profiles_delete_admin_only on public.admin_profiles;
create policy admin_profiles_delete_admin_only
on public.admin_profiles
for delete
to authenticated
using (public.is_admin_user());

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
  and (actor_id is null or actor_id = auth.uid() or public.is_admin_user())
);

drop policy if exists projects_public_read_published on public.projects;
create policy projects_public_read_published
on public.projects
for select
to anon, authenticated
using (is_published = true);

drop policy if exists projects_write_editor on public.projects;
create policy projects_write_editor
on public.projects
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists project_media_public_read_published_projects on public.project_media;
create policy project_media_public_read_published_projects
on public.project_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_media.project_id
      and p.is_published = true
  )
);

drop policy if exists project_media_write_editor on public.project_media;
create policy project_media_write_editor
on public.project_media
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists services_public_read_published on public.services;
create policy services_public_read_published
on public.services
for select
to anon, authenticated
using (is_published = true);

drop policy if exists services_write_editor on public.services;
create policy services_write_editor
on public.services
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists testimonials_public_read_published on public.testimonials;
create policy testimonials_public_read_published
on public.testimonials
for select
to anon, authenticated
using (is_published = true);

drop policy if exists testimonials_write_editor on public.testimonials;
create policy testimonials_write_editor
on public.testimonials
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists faqs_public_read_published on public.faqs;
create policy faqs_public_read_published
on public.faqs
for select
to anon, authenticated
using (is_published = true);

drop policy if exists faqs_write_editor on public.faqs;
create policy faqs_write_editor
on public.faqs
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists blog_categories_public_read_published on public.blog_categories;
create policy blog_categories_public_read_published
on public.blog_categories
for select
to anon, authenticated
using (is_published = true);

drop policy if exists blog_categories_write_editor on public.blog_categories;
create policy blog_categories_write_editor
on public.blog_categories
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists blog_posts_public_read_published on public.blog_posts;
create policy blog_posts_public_read_published
on public.blog_posts
for select
to anon, authenticated
using (is_published = true);

drop policy if exists blog_posts_write_editor on public.blog_posts;
create policy blog_posts_write_editor
on public.blog_posts
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists leads_read_editor on public.leads;
create policy leads_read_editor
on public.leads
for select
to authenticated
using (public.is_editor_user());

drop policy if exists leads_write_editor on public.leads;
create policy leads_write_editor
on public.leads
for all
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists quote_requests_read_editor on public.quote_requests;
create policy quote_requests_read_editor
on public.quote_requests
for select
to authenticated
using (public.is_editor_user());

drop policy if exists quote_requests_write_editor on public.quote_requests;
create policy quote_requests_write_editor
on public.quote_requests
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

drop policy if exists admin_panel_settings_read_editor on public.admin_panel_settings;
create policy admin_panel_settings_read_editor
on public.admin_panel_settings
for select
to authenticated
using (public.is_editor_user());

drop policy if exists admin_panel_settings_write_admin on public.admin_panel_settings;
create policy admin_panel_settings_write_admin
on public.admin_panel_settings
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists cms_assets_read_editor on public.cms_assets;
create policy cms_assets_read_editor
on public.cms_assets
for select
to authenticated
using (public.is_editor_user());

drop policy if exists cms_assets_insert_editor on public.cms_assets;
create policy cms_assets_insert_editor
on public.cms_assets
for insert
to authenticated
with check (public.is_editor_user());

drop policy if exists cms_assets_update_editor on public.cms_assets;
create policy cms_assets_update_editor
on public.cms_assets
for update
to authenticated
using (public.is_editor_user())
with check (public.is_editor_user());

drop policy if exists cms_assets_delete_admin on public.cms_assets;
create policy cms_assets_delete_admin
on public.cms_assets
for delete
to authenticated
using (public.is_admin_user());

drop policy if exists analytics_events_read_admin on public.analytics_events;
create policy analytics_events_read_admin
on public.analytics_events
for select
to authenticated
using (public.is_admin_user());

drop policy if exists analytics_events_write_admin on public.analytics_events;
create policy analytics_events_write_admin
on public.analytics_events
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists analytics_daily_rollups_read_admin on public.analytics_daily_rollups;
create policy analytics_daily_rollups_read_admin
on public.analytics_daily_rollups
for select
to authenticated
using (public.is_admin_user());

drop policy if exists analytics_daily_rollups_write_admin on public.analytics_daily_rollups;
create policy analytics_daily_rollups_write_admin
on public.analytics_daily_rollups
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists analytics_monthly_rollups_read_admin on public.analytics_monthly_rollups;
create policy analytics_monthly_rollups_read_admin
on public.analytics_monthly_rollups
for select
to authenticated
using (public.is_admin_user());

drop policy if exists analytics_monthly_rollups_write_admin on public.analytics_monthly_rollups;
create policy analytics_monthly_rollups_write_admin
on public.analytics_monthly_rollups
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists platform_usage_snapshots_read_admin on public.platform_usage_snapshots;
create policy platform_usage_snapshots_read_admin
on public.platform_usage_snapshots
for select
to authenticated
using (public.is_admin_user());

drop policy if exists platform_usage_snapshots_write_admin on public.platform_usage_snapshots;
create policy platform_usage_snapshots_write_admin
on public.platform_usage_snapshots
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists platform_alerts_read_admin on public.platform_alerts;
create policy platform_alerts_read_admin
on public.platform_alerts
for select
to authenticated
using (public.is_admin_user());

drop policy if exists platform_alerts_write_admin on public.platform_alerts;
create policy platform_alerts_write_admin
on public.platform_alerts
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

commit;
