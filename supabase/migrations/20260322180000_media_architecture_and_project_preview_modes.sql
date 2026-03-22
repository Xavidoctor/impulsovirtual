begin;

alter table public.projects
  add column if not exists preview_mode text not null default 'embed';

update public.projects
set preview_mode = 'embed'
where preview_mode = 'auto';

alter table public.projects
  alter column preview_mode set default 'embed';

alter table public.projects
  drop constraint if exists projects_preview_mode_check;

alter table public.projects
  add constraint projects_preview_mode_check
  check (preview_mode in ('embed', 'image', 'external_only'));

alter table public.cms_assets
  add column if not exists logical_collection text not null default 'general',
  add column if not exists storage_provider text not null default 'r2',
  add column if not exists bucket_name text not null default 'r2-public',
  add column if not exists caption text;

update public.cms_assets
set logical_collection = case
  when storage_key like 'projects/%' then 'projects'
  when storage_key like 'blog/%' then 'blog'
  when storage_key like 'brand/%' then 'brand'
  when storage_key like 'site/%' then 'site'
  when storage_key like 'proposals/%' then 'proposals'
  else 'general'
end;

update public.cms_assets
set
  storage_provider = case
    when storage_key like 'manual/%' or storage_key like 'legacy/%' then 'external'
    when storage_key like 'supabase/%' then 'supabase'
    else 'r2'
  end,
  bucket_name = case
    when storage_key like 'manual/%' or storage_key like 'legacy/%' then 'external'
    when storage_key like 'supabase/%' then 'supabase-public'
    else 'r2-public'
  end;

alter table public.cms_assets
  drop constraint if exists cms_assets_logical_collection_check;

alter table public.cms_assets
  add constraint cms_assets_logical_collection_check
  check (logical_collection in ('projects', 'blog', 'brand', 'site', 'proposals', 'general'));

alter table public.cms_assets
  drop constraint if exists cms_assets_storage_provider_check;

alter table public.cms_assets
  add constraint cms_assets_storage_provider_check
  check (storage_provider in ('r2', 'supabase', 'external'));

create index if not exists cms_assets_collection_created_idx
  on public.cms_assets(logical_collection, created_at desc);

create index if not exists cms_assets_provider_created_idx
  on public.cms_assets(storage_provider, created_at desc);

commit;
