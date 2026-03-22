begin;

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values
      ('blog-covers', 'blog-covers', true),
      ('project-media', 'project-media', true),
      ('brand-assets', 'brand-assets', true),
      ('site-media', 'site-media', true),
      ('admin-private', 'admin-private', false),
      ('proposal-files', 'proposal-files', false)
    on conflict (id) do update
    set public = excluded.public;
  end if;
end $$;

drop policy if exists "iv_public_buckets_read" on storage.objects;
create policy "iv_public_buckets_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('blog-covers', 'project-media', 'brand-assets', 'site-media'));

drop policy if exists "iv_private_buckets_read_editor" on storage.objects;
create policy "iv_private_buckets_read_editor"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('admin-private', 'proposal-files')
  and public.is_editor_user()
);

drop policy if exists "iv_buckets_insert_editor" on storage.objects;
create policy "iv_buckets_insert_editor"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('blog-covers', 'project-media', 'brand-assets', 'site-media', 'admin-private', 'proposal-files')
  and public.is_editor_user()
);

drop policy if exists "iv_buckets_update_editor" on storage.objects;
create policy "iv_buckets_update_editor"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('blog-covers', 'project-media', 'brand-assets', 'site-media', 'admin-private', 'proposal-files')
  and public.is_editor_user()
)
with check (
  bucket_id in ('blog-covers', 'project-media', 'brand-assets', 'site-media', 'admin-private', 'proposal-files')
  and public.is_editor_user()
);

drop policy if exists "iv_buckets_delete_editor" on storage.objects;
create policy "iv_buckets_delete_editor"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('blog-covers', 'project-media', 'brand-assets', 'site-media', 'admin-private', 'proposal-files')
  and public.is_editor_user()
);

commit;
