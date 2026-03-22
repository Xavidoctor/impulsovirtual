begin;

alter table public.projects
  add column if not exists company_logo_url text;

commit;

