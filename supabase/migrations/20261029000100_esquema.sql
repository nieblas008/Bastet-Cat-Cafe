-- ════════════════════════════════════════════════════════════════════
-- Bastet Cat Café · esquema base
-- Todo lo que el personal edita desde /panel vive aquí.
-- Las reglas de acceso (RLS) están en la siguiente migración.
-- ════════════════════════════════════════════════════════════════════

create schema if not exists extensions;
create extension if not exists citext with schema extensions;

-- ── Tipos ───────────────────────────────────────────────────────────

-- admin: Elizabeth (y quien ella decida) · maneja al equipo y todo lo demás
-- staff: el resto del personal · edita contenido, no maneja cuentas
-- padrino: persona que apadrina a un gato · solo ve su portal
create type public.app_role as enum ('admin', 'staff', 'padrino');

-- Los estados nunca se aplanan en uno solo (ver docs/prototipo.md)
create type public.cat_status as enum (
  'disponible',      -- en adopción
  'apartado',        -- alguien está en proceso; periodo de gracia de hasta una semana
  'adoptado',        -- ya se fue a casa; queda en el muro de adoptados
  'residente',       -- vive en el café, no está en adopción
  'en_tratamiento'   -- se está recuperando, todavía no se puede adoptar
);

create type public.cat_sex as enum ('hembra', 'macho');

create type public.post_category as enum (
  'concientizacion', -- abandono, esterilización, cuidados
  'evento',          -- tiene fecha y lugar; sale de "próximos" solo cuando pasa
  'noticia',
  'historia',        -- historias de adopción
  'sorteo'           -- entrada de blog que manda a Instagram (no hay plataforma de rifas)
);

create type public.post_status as enum ('borrador', 'publicado');

create type public.application_status as enum (
  'nueva', 'en_entrevista', 'aprobada', 'rechazada', 'adoptada', 'cancelada'
);

create type public.sponsorship_status as enum ('pendiente', 'activa', 'pausada', 'cancelada');

create type public.payment_method as enum ('transferencia', 'tarjeta', 'efectivo');

create type public.wishlist_priority as enum ('urgente', 'normal', 'cuando_se_pueda');

-- ── Utilidades ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ── Perfiles (uno por cada cuenta de auth.users) ───────────────────

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       extensions.citext,
  full_name   text not null default '',
  phone       text,
  role        public.app_role not null default 'padrino',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Una fila por cuenta. El rol solo lo cambia una admin.';

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Configuración general del sitio (una sola fila) ────────────────

create table public.site_settings (
  id                      smallint primary key default 1 check (id = 1),
  cafe_name               text not null default 'Bastet Cat Café',
  tagline                 text not null default 'Café de especialidad y refugio felino en Tijuana',
  address                 text,
  maps_url                text,
  maps_embed_url          text,
  phone                   text,
  whatsapp_number         text,          -- solo dígitos con lada de país, p. ej. 526645266353
  email                   extensions.citext,
  applications_email      extensions.citext,        -- a dónde avisar de solicitudes nuevas
  instagram_url           text,
  facebook_url            text,
  tiktok_url              text,
  -- adopción
  adoption_fee_mxn        integer not null default 800 check (adoption_fee_mxn >= 0),
  show_adoption_fee       boolean not null default true,
  adoption_response_days  integer check (adoption_response_days > 0),   -- null = no se muestra
  online_applications     boolean not null default true,                -- false = solo WhatsApp
  -- contador rumbo a la meta
  adoptions_count         integer not null default 0 check (adoptions_count >= 0),
  adoptions_count_as_of   date,
  adoptions_goal          integer not null default 10000 check (adoptions_goal > 0),
  show_adoptions_counter  boolean not null default true,
  -- visita
  entry_fee_note          text,          -- costo de entrada o consumo mínimo, si hay
  -- donativos por transferencia
  bank_name               text,
  bank_account_holder     text,
  bank_clabe              text,
  bank_card_number        text,
  donations_note          text,
  updated_at              timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ── Textos editables por bloque (hero, nosotros, reglas de visita…) ─

create table public.page_blocks (
  key         text primary key check (key ~ '^[a-z0-9_]+$'),
  label       text not null,             -- nombre que ve el personal en el panel
  page        text not null,             -- en qué página aparece, para agrupar en el panel
  title       text,
  body        text not null default '',  -- markdown sencillo
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);
create trigger page_blocks_updated_at before update on public.page_blocks
  for each row execute function public.set_updated_at();

-- ── Horario ────────────────────────────────────────────────────────

create table public.weekly_schedule (
  day_of_week smallint primary key check (day_of_week between 0 and 6), -- 0 = domingo
  is_open     boolean not null default true,
  opens_at    time,
  closes_at   time,
  note        text,
  updated_at  timestamptz not null default now(),
  constraint horario_completo check (not is_open or (opens_at is not null and closes_at is not null))
);
insert into public.weekly_schedule (day_of_week, is_open)
  select d, false from generate_series(0, 6) d;

create trigger weekly_schedule_updated_at before update on public.weekly_schedule
  for each row execute function public.set_updated_at();

-- Días especiales: "cerrado 25 dic", horario extendido, etc.
create table public.schedule_exceptions (
  date        date primary key,
  is_open     boolean not null default false,
  opens_at    time,
  closes_at   time,
  note        text,
  created_at  timestamptz not null default now(),
  constraint excepcion_completa check (not is_open or (opens_at is not null and closes_at is not null))
);

-- ── Gatos ──────────────────────────────────────────────────────────

-- Parejas inseparables o camadas que se muestran juntas
create table public.cat_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        text not null default 'pareja' check (kind in ('pareja', 'camada')),
  adopt_together boolean not null default true,
  description text,
  created_at  timestamptz not null default now()
);

create table public.cats (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                text not null,
  status              public.cat_status not null default 'disponible',
  sex                 public.cat_sex,
  birth_date          date,            -- aproximada; de aquí sale la edad
  age_label           text,            -- alternativa si no saben la fecha ("unos 2 años")
  arrived_at          date,
  reserved_until      date,            -- fin del periodo de gracia cuando está apartado
  adopted_at          date,
  short_bio           text,            -- 1–2 líneas para la tarjeta
  personality         text,            -- texto largo de la ficha
  traits              text[] not null default '{}',   -- "apapachadora", "curiosa"…
  -- salud: lo que cubre la cuota de recuperación
  vaccinated          boolean not null default false,
  sterilized          boolean not null default false,
  dewormed            boolean not null default false,
  health_notes        text,
  -- convivencia: null = no sabemos
  good_with_kids      boolean,
  good_with_dogs      boolean,
  good_with_cats      boolean,
  special_needs       boolean not null default false,
  special_needs_notes text,
  group_id            uuid references public.cat_groups (id) on delete set null,
  featured            boolean not null default false, -- sale primero en el inicio
  published           boolean not null default false, -- borrador hasta que lo publiquen
  sort_order          integer not null default 0,
  created_by          uuid references public.profiles (id) on delete set null,
  updated_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index cats_public_idx on public.cats (published, status, sort_order);
create index cats_group_idx on public.cats (group_id);

create trigger cats_updated_at before update on public.cats
  for each row execute function public.set_updated_at();

create table public.cat_photos (
  id            uuid primary key default gen_random_uuid(),
  cat_id        uuid not null references public.cats (id) on delete cascade,
  storage_path  text not null,         -- ruta dentro del bucket "publico"
  alt           text,
  sort_order    integer not null default 0, -- la primera es la portada
  created_at    timestamptz not null default now()
);
create index cat_photos_cat_idx on public.cat_photos (cat_id, sort_order);

-- "Avísame si vuelve a estar disponible"
create table public.cat_interest (
  id          uuid primary key default gen_random_uuid(),
  cat_id      uuid not null references public.cats (id) on delete cascade,
  name        text not null check (length(name) between 1 and 120),
  contact     text not null check (length(contact) between 5 and 160), -- WhatsApp o correo
  notified    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- El contador sube solo cuando un gato pasa a "adoptado" (y baja si fue un error)
create or replace function public.cats_status_side_effects()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'adoptado' then
      new.adopted_at := coalesce(new.adopted_at, current_date);
      new.reserved_until := null;
      update public.site_settings set adoptions_count = adoptions_count + 1 where id = 1;
    elsif old.status = 'adoptado' then
      new.adopted_at := null;
      update public.site_settings set adoptions_count = greatest(adoptions_count - 1, 0) where id = 1;
    end if;
    if new.status = 'apartado' and new.reserved_until is null then
      new.reserved_until := current_date + 7;
    elsif new.status <> 'apartado' then
      new.reserved_until := null;
    end if;
  elsif tg_op = 'INSERT' and new.status = 'apartado' and new.reserved_until is null then
    new.reserved_until := current_date + 7;
  end if;
  return new;
end $$;

create trigger cats_status_side_effects before insert or update of status on public.cats
  for each row execute function public.cats_status_side_effects();

-- ── Menú ───────────────────────────────────────────────────────────

create table public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon        text,                    -- nombre de ícono (coffee, tea, cold, bread, salty, sweet, star)
  description text,
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.menu_categories (id) on delete restrict,
  name          text not null,
  description   text,
  price_mxn     numeric(8, 2) not null check (price_mxn >= 0),
  price_note    text,                  -- "avena +$10", "chico / grande"
  badge         text,                  -- "favorito de la casa", "llega diario"
  dietary_tags  text[] not null default '{}' check (dietary_tags <@ array['vegetariano', 'vegano', 'lacteos', 'nueces', 'gluten', 'picante']::text[]),
  photo_path    text,                  -- opcional, en bucket "publico"
  available     boolean not null default true,   -- false = agotado hoy
  seasonal      boolean not null default false,  -- temporada / edición limitada
  visible       boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index menu_items_category_idx on public.menu_items (category_id, sort_order);

create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ── Blog y eventos ─────────────────────────────────────────────────

create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null,
  excerpt          text,
  body             text not null default '',  -- markdown sencillo
  cover_path       text,
  category         public.post_category not null default 'noticia',
  status           public.post_status not null default 'borrador',
  pinned           boolean not null default false,
  published_at     timestamptz,
  -- solo para eventos
  event_starts_at  timestamptz,
  event_ends_at    timestamptz,
  event_location   text,
  -- llamada a la acción (sorteos, campañas)
  cta_label        text,
  cta_url          text,
  related_cat_id   uuid references public.cats (id) on delete set null,
  author_id        uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint evento_con_fecha check (category <> 'evento' or event_starts_at is not null)
);
create index posts_public_idx on public.posts (status, pinned desc, published_at desc);

create or replace function public.posts_publish_date()
returns trigger language plpgsql as $$
begin
  if new.status = 'publicado' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger posts_publish_date before insert or update on public.posts
  for each row execute function public.posts_publish_date();
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- ── Adopción ───────────────────────────────────────────────────────

-- Los requisitos publicados (identificación, comprobante, etc.)
create table public.adoption_requirements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  sort_order  integer not null default 0
);

create table public.faqs (
  id          uuid primary key default gen_random_uuid(),
  topic       text not null default 'adopcion' check (topic in ('adopcion', 'visita', 'apadrina', 'general')),
  question    text not null,
  answer      text not null,
  visible     boolean not null default true,
  sort_order  integer not null default 0
);

create table public.adoption_applications (
  id                    uuid primary key default gen_random_uuid(),
  cat_id                uuid references public.cats (id) on delete set null, -- null = "ayúdenme a elegir"
  status                public.application_status not null default 'nueva',
  -- contacto
  full_name             text not null check (length(full_name) between 2 and 160),
  email                 extensions.citext check (email is null or length(email) <= 200),
  phone                 text not null check (length(phone) between 7 and 30),
  city                  text,
  neighborhood          text,
  age                   integer check (age is null or age between 18 and 120),
  -- autoevaluación (los seis requisitos)
  has_official_id       boolean not null default false,
  has_proof_of_address  boolean not null default false,
  has_carrier           boolean not null default false,
  accepts_fee           boolean not null default false,
  -- preguntas de filtro de la entrevista
  housing_type          text check (housing_type is null or housing_type in ('casa', 'departamento', 'cuarto', 'otro')),
  housing_tenure        text check (housing_tenure is null or housing_tenure in ('propia', 'rentada', 'familiar')),
  landlord_allows_pets  boolean,
  household_adults      integer check (household_adults is null or household_adults between 0 and 30),
  household_children    integer check (household_children is null or household_children between 0 and 30),
  children_ages         text,
  other_pets            text,
  pets_sterilized       boolean,
  planned_move          boolean,
  expecting_family_change boolean,     -- bebé, pareja nueva, otra mascota
  hours_alone           text,
  previous_cats         text,
  why_adopt             text check (why_adopt is null or length(why_adopt) <= 4000),
  extra_notes           text check (extra_notes is null or length(extra_notes) <= 4000),
  privacy_accepted      boolean not null default false check (privacy_accepted),
  -- operación
  interview_at          timestamptz,
  assigned_to           uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index adoption_applications_status_idx on public.adoption_applications (status, created_at desc);

create trigger adoption_applications_updated_at before update on public.adoption_applications
  for each row execute function public.set_updated_at();

create table public.application_notes (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.adoption_applications (id) on delete cascade,
  author_id       uuid references public.profiles (id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);

-- ── Seguimiento de adoptantes ─────────────────────────────────────

create table public.adopters (
  id                      uuid primary key default gen_random_uuid(),
  application_id          uuid references public.adoption_applications (id) on delete set null,
  cat_id                  uuid references public.cats (id) on delete set null,
  cat_name                text,          -- por si el gato no está en el sitio (adopciones viejas)
  full_name               text not null,
  phone                   text,
  email                   extensions.citext,
  adopted_on              date not null default current_date,
  followup_interval_days  integer not null default 7 check (followup_interval_days between 1 and 365),
  next_followup_on        date,
  followup_active         boolean not null default true,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index adopters_followup_idx on public.adopters (followup_active, next_followup_on);

create trigger adopters_updated_at before update on public.adopters
  for each row execute function public.set_updated_at();

create or replace function public.adopters_default_next()
returns trigger language plpgsql as $$
begin
  if new.next_followup_on is null then
    new.next_followup_on := new.adopted_on + new.followup_interval_days;
  end if;
  return new;
end $$;
create trigger adopters_default_next before insert on public.adopters
  for each row execute function public.adopters_default_next();

create table public.followup_contacts (
  id            uuid primary key default gen_random_uuid(),
  adopter_id    uuid not null references public.adopters (id) on delete cascade,
  contacted_at  timestamptz not null default now(),
  channel       text not null default 'whatsapp' check (channel in ('whatsapp', 'llamada', 'correo', 'en_persona', 'otro')),
  outcome       text not null default 'todo_bien' check (outcome in ('todo_bien', 'atencion', 'sin_respuesta', 'devolucion')),
  notes         text,
  by_profile    uuid references public.profiles (id) on delete set null
);

-- Al registrar un contacto, se programa el siguiente
create or replace function public.followup_schedule_next()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.adopters
     set next_followup_on = (new.contacted_at at time zone 'America/Tijuana')::date + followup_interval_days
   where id = new.adopter_id;
  return new;
end $$;
create trigger followup_schedule_next after insert on public.followup_contacts
  for each row execute function public.followup_schedule_next();

-- ── Apadrinamiento ────────────────────────────────────────────────

create table public.sponsorship_tiers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  monthly_mxn   numeric(8, 2) not null check (monthly_mxn > 0),
  description   text,
  perks         text[] not null default '{}',
  visible       boolean not null default true,
  sort_order    integer not null default 0
);

create table public.sponsorships (
  id              uuid primary key default gen_random_uuid(),
  sponsor_id      uuid not null references public.profiles (id) on delete cascade,
  cat_id          uuid not null references public.cats (id) on delete cascade,
  tier_id         uuid references public.sponsorship_tiers (id) on delete set null,
  status          public.sponsorship_status not null default 'pendiente',
  payment_method  public.payment_method not null default 'transferencia',
  public_name     text,                -- si quiere aparecer en el muro de padrinos (opt-in)
  show_publicly   boolean not null default false,
  is_gift         boolean not null default false,
  gift_recipient  text,
  started_at      date,
  ended_at        date,
  notes           text,                -- notas internas del personal
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index sponsorships_sponsor_idx on public.sponsorships (sponsor_id, status);
create index sponsorships_cat_idx on public.sponsorships (cat_id, status);

create trigger sponsorships_updated_at before update on public.sponsorships
  for each row execute function public.set_updated_at();

-- Registro manual de pagos (transferencias). Los cobros con tarjeta llegan después.
create table public.sponsorship_payments (
  id              uuid primary key default gen_random_uuid(),
  sponsorship_id  uuid not null references public.sponsorships (id) on delete cascade,
  amount_mxn      numeric(10, 2) not null check (amount_mxn > 0),
  paid_on         date not null default current_date,
  method          public.payment_method not null default 'transferencia',
  reference       text,
  recorded_by     uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Fotos y videos privados que solo ven los padrinos de ese gato
create table public.sponsor_media (
  id            uuid primary key default gen_random_uuid(),
  cat_id        uuid not null references public.cats (id) on delete cascade,
  storage_path  text not null unique,  -- ruta dentro del bucket privado "padrinos"
  media_type    text not null default 'foto' check (media_type in ('foto', 'video')),
  caption       text,
  uploaded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index sponsor_media_cat_idx on public.sponsor_media (cat_id, created_at desc);

-- ── Ayudar sin adoptar ────────────────────────────────────────────

create table public.wishlist_items (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text,
  priority           public.wishlist_priority not null default 'normal',
  quantity_needed    integer check (quantity_needed is null or quantity_needed > 0),
  quantity_received  integer not null default 0 check (quantity_received >= 0),
  buy_url            text,
  visible            boolean not null default true,
  sort_order         integer not null default 0,
  updated_at         timestamptz not null default now()
);
create trigger wishlist_items_updated_at before update on public.wishlist_items
  for each row execute function public.set_updated_at();

-- ── Concientización ──────────────────────────────────────────────

-- Datos sueltos en tarjetas ("a los 4 meses ya puede quedar embarazada")
create table public.awareness_facts (
  id          uuid primary key default gen_random_uuid(),
  headline    text not null,
  body        text,
  source      text,
  visible     boolean not null default true,
  sort_order  integer not null default 0
);

-- Clínicas y veterinarios para esterilizar
create table public.sterilization_resources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  phone       text,
  url         text,
  notes       text,
  visible     boolean not null default true,
  sort_order  integer not null default 0
);

-- ── Mensajes de contacto ─────────────────────────────────────────

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  topic       text not null default 'general' check (topic in ('general', 'adopcion', 'prensa', 'escuelas', 'eventos', 'encontre_un_gato')),
  name        text not null check (length(name) between 1 and 160),
  email       extensions.citext check (email is null or length(email) <= 200),
  phone       text check (phone is null or length(phone) <= 30),
  message     text not null check (length(message) between 1 and 5000),
  handled     boolean not null default false,
  handled_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── Historial de cambios (quién editó qué y cuándo) ──────────────

create table public.audit_log (
  id          bigint generated always as identity primary key,
  table_name  text not null,
  record_id   text,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id    uuid,
  summary     text,
  changes     jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

create or replace function public.log_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_changes jsonb;
  v_row jsonb := coalesce(v_new, v_old);
begin
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(key, jsonb_build_object('antes', v_old -> key, 'despues', value))
      into v_changes
      from jsonb_each(v_new)
     where key not in ('updated_at') and (v_old -> key) is distinct from value;
    if v_changes is null then return new; end if;
  else
    v_changes := v_row;
  end if;

  insert into public.audit_log (table_name, record_id, action, actor_id, summary, changes)
  values (
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'day_of_week', v_row ->> 'date'),
    tg_op,
    auth.uid(),
    coalesce(v_row ->> 'name', v_row ->> 'title', v_row ->> 'full_name', v_row ->> 'label', v_row ->> 'question', v_row ->> 'headline'),
    v_changes
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'cats', 'cat_photos', 'cat_groups', 'menu_categories', 'menu_items', 'posts',
    'weekly_schedule', 'schedule_exceptions', 'site_settings', 'page_blocks',
    'adoption_requirements', 'faqs', 'adoption_applications', 'adopters',
    'sponsorship_tiers', 'sponsorships', 'sponsorship_payments', 'sponsor_media',
    'wishlist_items', 'awareness_facts', 'sterilization_resources', 'profiles'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()',
      t || '_audit', t
    );
  end loop;
end $$;
