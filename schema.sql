-- Run this once in the Supabase SQL editor.

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  one_liner text not null check (char_length(one_liner) <= 120),
  reason text not null check (char_length(reason) <= 400),
  year text,
  name text,
  anonymous boolean not null default false,
  x_handle text,
  linkedin text,
  image_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected'))
);

alter table public.stories enable row level security;

create policy "public can submit" on public.stories
  for insert to anon with check (status = 'pending');
create policy "public reads approved" on public.stories
  for select to anon using (status = 'approved');
create policy "admin reads all" on public.stories
  for select to authenticated using (true);
create policy "admin updates" on public.stories
  for update to authenticated using (true);
create policy "admin deletes" on public.stories
  for delete to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('screenshots', 'screenshots', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif']);

create policy "public uploads screenshots" on storage.objects
  for insert to anon with check (bucket_id = 'screenshots');
create policy "public views screenshots" on storage.objects
  for select to public using (bucket_id = 'screenshots');
create policy "admin deletes screenshots" on storage.objects
  for delete to authenticated using (bucket_id = 'screenshots');
