-- ════════════════════════════════════════════════════════════════════
-- Cuentas, roles y reglas de acceso (Row Level Security)
--
-- Regla general:
--   · El público (anon) solo LEE lo publicado/visible, y solo INSERTA
--     solicitudes, mensajes y "avísame".
--   · El personal (admin + staff) lee y edita todo el contenido.
--   · Solo admin maneja cuentas y roles.
--   · Un padrino solo ve sus apadrinamientos y el material privado de sus gatos.
-- ════════════════════════════════════════════════════════════════════

-- ── Helpers (security definer para no caer en recursión de RLS) ────

create or replace function public.current_role_name()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'staff') from public.profiles where id = auth.uid() and active), false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid() and active), false)
$$;

create or replace function public.sponsors_cat(p_cat uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sponsorships
     where cat_id = p_cat and sponsor_id = auth.uid() and status = 'activa'
  )
$$;

revoke all on function public.current_role_name(), public.is_staff(), public.is_admin(), public.sponsors_cat(uuid) from public;
grant execute on function public.current_role_name(), public.is_staff(), public.is_admin(), public.sponsors_cat(uuid) to anon, authenticated;

-- ── Perfil automático al crear una cuenta ──────────────────────────
-- El rol sale de app_metadata, que solo se puede escribir con la llave
-- de servicio (invitaciones desde el panel). Quien se registra solo
-- desde el sitio siempre queda como padrino.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role public.app_role := 'padrino';
begin
  if new.raw_app_meta_data ->> 'role' in ('admin', 'staff') then
    v_role := (new.raw_app_meta_data ->> 'role')::public.app_role;
  end if;
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    v_role
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nadie cambia su propio rol ni el de otros, salvo una admin.
-- Una admin tampoco se puede quitar a sí misma el rol (para no quedarse sin admins).
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active) then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Solo una administradora puede cambiar roles o desactivar cuentas';
    end if;
    if auth.uid() = old.id and old.role = 'admin' and (new.role <> 'admin' or not new.active) then
      raise exception 'No puedes quitarte a ti misma el acceso de administradora';
    end if;
  end if;
  if new.email is distinct from old.email and auth.uid() is not null then
    new.email := old.email; -- el correo se sincroniza desde auth, no se edita aquí
  end if;
  return new;
end $$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ── Activar RLS en todas las tablas ────────────────────────────────

do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ── Contenido público: lectura abierta de lo visible, edición de personal ─

-- Macro mental: "<tabla>_public_read" + "<tabla>_staff_all"

create policy profiles_self_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_staff_update on public.site_settings for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy page_blocks_public_read on public.page_blocks for select to anon, authenticated
  using (visible or public.is_staff());
create policy page_blocks_staff_all on public.page_blocks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy weekly_schedule_public_read on public.weekly_schedule for select to anon, authenticated using (true);
create policy weekly_schedule_staff_update on public.weekly_schedule for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy schedule_exceptions_public_read on public.schedule_exceptions for select to anon, authenticated using (true);
create policy schedule_exceptions_staff_all on public.schedule_exceptions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy cat_groups_public_read on public.cat_groups for select to anon, authenticated using (true);
create policy cat_groups_staff_all on public.cat_groups for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy cats_public_read on public.cats for select to anon, authenticated
  using (published or public.is_staff() or public.sponsors_cat(id));
create policy cats_staff_all on public.cats for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy cat_photos_public_read on public.cat_photos for select to anon, authenticated
  using (exists (select 1 from public.cats c where c.id = cat_id and (c.published or public.is_staff() or public.sponsors_cat(c.id))));
create policy cat_photos_staff_all on public.cat_photos for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy cat_interest_public_insert on public.cat_interest for insert to anon, authenticated
  with check (notified = false and exists (select 1 from public.cats c where c.id = cat_id and c.published));
create policy cat_interest_staff_all on public.cat_interest for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy menu_categories_public_read on public.menu_categories for select to anon, authenticated
  using (visible or public.is_staff());
create policy menu_categories_staff_all on public.menu_categories for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy menu_items_public_read on public.menu_items for select to anon, authenticated
  using (visible or public.is_staff());
create policy menu_items_staff_all on public.menu_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy posts_public_read on public.posts for select to anon, authenticated
  using ((status = 'publicado' and published_at <= now()) or public.is_staff());
create policy posts_staff_all on public.posts for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy adoption_requirements_public_read on public.adoption_requirements for select to anon, authenticated using (true);
create policy adoption_requirements_staff_all on public.adoption_requirements for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy faqs_public_read on public.faqs for select to anon, authenticated
  using (visible or public.is_staff());
create policy faqs_staff_all on public.faqs for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy sponsorship_tiers_public_read on public.sponsorship_tiers for select to anon, authenticated
  using (visible or public.is_staff());
create policy sponsorship_tiers_staff_all on public.sponsorship_tiers for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy wishlist_items_public_read on public.wishlist_items for select to anon, authenticated
  using (visible or public.is_staff());
create policy wishlist_items_staff_all on public.wishlist_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy awareness_facts_public_read on public.awareness_facts for select to anon, authenticated
  using (visible or public.is_staff());
create policy awareness_facts_staff_all on public.awareness_facts for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy sterilization_resources_public_read on public.sterilization_resources for select to anon, authenticated
  using (visible or public.is_staff());
create policy sterilization_resources_staff_all on public.sterilization_resources for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ── Datos personales: el público solo inserta, el personal administra ─

create policy adoption_applications_public_insert on public.adoption_applications for insert to anon, authenticated
  with check (status = 'nueva' and interview_at is null and assigned_to is null);
create policy adoption_applications_staff_all on public.adoption_applications for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy application_notes_staff_all on public.application_notes for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy adopters_staff_all on public.adopters for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy followup_contacts_staff_all on public.followup_contacts for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy contact_messages_public_insert on public.contact_messages for insert to anon, authenticated
  with check (handled = false and handled_by is null);
create policy contact_messages_staff_all on public.contact_messages for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ── Padrinos ───────────────────────────────────────────────────────

create policy sponsorships_own_read on public.sponsorships for select to authenticated
  using (sponsor_id = auth.uid() or public.is_staff());
-- Un padrino puede pedir un apadrinamiento; queda "pendiente" hasta que el personal confirme el pago
create policy sponsorships_own_request on public.sponsorships for insert to authenticated
  with check (
    sponsor_id = auth.uid() and status = 'pendiente' and notes is null and started_at is null
    and exists (select 1 from public.cats c where c.id = cat_id and c.published and c.status in ('disponible', 'apartado', 'residente', 'en_tratamiento'))
  );
create policy sponsorships_staff_all on public.sponsorships for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy sponsorship_payments_own_read on public.sponsorship_payments for select to authenticated
  using (public.is_staff() or exists (select 1 from public.sponsorships s where s.id = sponsorship_id and s.sponsor_id = auth.uid()));
create policy sponsorship_payments_staff_all on public.sponsorship_payments for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy sponsor_media_sponsor_read on public.sponsor_media for select to authenticated
  using (public.is_staff() or public.sponsors_cat(cat_id));
create policy sponsor_media_staff_all on public.sponsor_media for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Muro de padrinos (opt-in): solo lo que el padrino aceptó mostrar
create or replace function public.sponsor_wall()
returns table (public_name text, cat_name text, cat_slug text, started_at date)
language sql stable security definer set search_path = public as $$
  select s.public_name, c.name, c.slug, s.started_at
    from public.sponsorships s
    join public.cats c on c.id = s.cat_id
   where s.status = 'activa' and s.show_publicly and s.public_name is not null and c.published
   order by s.started_at nulls last
$$;

-- Cuántos padrinos activos tiene cada gato publicado (sin exponer quiénes)
create or replace function public.cat_sponsor_counts()
returns table (cat_id uuid, sponsors int)
language sql stable security definer set search_path = public as $$
  select s.cat_id, count(*)::int
    from public.sponsorships s
    join public.cats c on c.id = s.cat_id
   where s.status = 'activa' and c.published
   group by s.cat_id
$$;

revoke all on function public.sponsor_wall(), public.cat_sponsor_counts() from public;
grant execute on function public.sponsor_wall(), public.cat_sponsor_counts() to anon, authenticated;

-- ── Historial: solo lectura para el personal ──────────────────────

create policy audit_log_staff_read on public.audit_log for select to authenticated using (public.is_staff());

-- ── Permisos de tabla (RLS decide fila por fila) ──────────────────

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.adoption_applications, public.contact_messages, public.cat_interest to anon;
revoke insert, update, delete on public.audit_log from authenticated;
