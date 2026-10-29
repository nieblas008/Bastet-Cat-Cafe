-- ════════════════════════════════════════════════════════════════════
-- Almacenamiento de fotos
--   publico  → fotos de gatos, menú, blog y del lugar. Cualquiera las ve.
--   padrinos → fotos y videos privados. Solo el personal y los padrinos
--              activos de ese gato. Se sirven con URLs firmadas.
-- ════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('publico', 'publico', true, 8 * 1024 * 1024,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('padrinos', 'padrinos', false, 100 * 1024 * 1024,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy "publico: lectura abierta" on storage.objects for select to anon, authenticated
  using (bucket_id = 'publico');
create policy "publico: personal sube" on storage.objects for insert to authenticated
  with check (bucket_id = 'publico' and public.is_staff());
create policy "publico: personal edita" on storage.objects for update to authenticated
  using (bucket_id = 'publico' and public.is_staff()) with check (bucket_id = 'publico' and public.is_staff());
create policy "publico: personal borra" on storage.objects for delete to authenticated
  using (bucket_id = 'publico' and public.is_staff());

create policy "padrinos: personal administra" on storage.objects for all to authenticated
  using (bucket_id = 'padrinos' and public.is_staff())
  with check (bucket_id = 'padrinos' and public.is_staff());
create policy "padrinos: padrino ve lo de su gato" on storage.objects for select to authenticated
  using (
    bucket_id = 'padrinos'
    and exists (
      select 1 from public.sponsor_media m
       where m.storage_path = storage.objects.name and public.sponsors_cat(m.cat_id)
    )
  );
