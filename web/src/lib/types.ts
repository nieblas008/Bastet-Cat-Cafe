// Tipos de las tablas de Supabase (ver supabase/migrations).
// Si cambias el esquema, actualiza aquí también.

export type AppRole = "admin" | "staff" | "padrino";
export type CatStatus = "disponible" | "apartado" | "adoptado" | "residente" | "en_tratamiento";
export type CatSex = "hembra" | "macho";
export type PostCategory = "concientizacion" | "evento" | "noticia" | "historia" | "sorteo";
export type PostStatus = "borrador" | "publicado";
export type ApplicationStatus = "nueva" | "en_entrevista" | "aprobada" | "rechazada" | "adoptada" | "cancelada";
export type SponsorshipStatus = "pendiente" | "activa" | "pausada" | "cancelada";
export type PaymentMethod = "transferencia" | "tarjeta" | "efectivo";
export type WishlistPriority = "urgente" | "normal" | "cuando_se_pueda";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: AppRole;
  active: boolean;
  created_at: string;
}

export interface SiteSettings {
  cafe_name: string;
  tagline: string;
  address: string | null;
  maps_url: string | null;
  maps_embed_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  applications_email: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  adoption_fee_mxn: number;
  show_adoption_fee: boolean;
  adoption_response_days: number | null;
  online_applications: boolean;
  adoptions_count: number;
  adoptions_count_as_of: string | null;
  adoptions_goal: number;
  show_adoptions_counter: boolean;
  entry_fee_note: string | null;
  bank_name: string | null;
  bank_account_holder: string | null;
  bank_clabe: string | null;
  bank_card_number: string | null;
  donations_note: string | null;
  updated_at: string;
}

export interface PageBlock {
  key: string;
  label: string;
  page: string;
  title: string | null;
  body: string;
  visible: boolean;
  sort_order: number;
  updated_at: string;
}

export interface ScheduleDay {
  day_of_week: number;
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  note: string | null;
}

export interface ScheduleException {
  date: string;
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  note: string | null;
}

export interface CatPhoto {
  id: string;
  cat_id: string;
  storage_path: string;
  alt: string | null;
  sort_order: number;
}

export interface CatGroup {
  id: string;
  name: string;
  kind: "pareja" | "camada";
  adopt_together: boolean;
  description: string | null;
}

export interface Cat {
  id: string;
  slug: string;
  name: string;
  status: CatStatus;
  sex: CatSex | null;
  birth_date: string | null;
  age_label: string | null;
  arrived_at: string | null;
  reserved_until: string | null;
  adopted_at: string | null;
  short_bio: string | null;
  personality: string | null;
  traits: string[];
  vaccinated: boolean;
  sterilized: boolean;
  dewormed: boolean;
  health_notes: string | null;
  good_with_kids: boolean | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  special_needs: boolean;
  special_needs_notes: string | null;
  group_id: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type CatWithPhotos = Cat & { cat_photos: CatPhoto[]; cat_groups?: CatGroup | null };

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  visible: boolean;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_mxn: number;
  price_note: string | null;
  badge: string | null;
  dietary_tags: string[];
  photo_path: string | null;
  available: boolean;
  seasonal: boolean;
  visible: boolean;
  sort_order: number;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_path: string | null;
  category: PostCategory;
  status: PostStatus;
  pinned: boolean;
  published_at: string | null;
  event_starts_at: string | null;
  event_ends_at: string | null;
  event_location: string | null;
  cta_label: string | null;
  cta_url: string | null;
  related_cat_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdoptionRequirement {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface Faq {
  id: string;
  topic: "adopcion" | "visita" | "apadrina" | "general";
  question: string;
  answer: string;
  visible: boolean;
  sort_order: number;
}

export interface AdoptionApplication {
  id: string;
  cat_id: string | null;
  status: ApplicationStatus;
  full_name: string;
  email: string | null;
  phone: string;
  city: string | null;
  neighborhood: string | null;
  age: number | null;
  has_official_id: boolean;
  has_proof_of_address: boolean;
  has_carrier: boolean;
  accepts_fee: boolean;
  housing_type: string | null;
  housing_tenure: string | null;
  landlord_allows_pets: boolean | null;
  household_adults: number | null;
  household_children: number | null;
  children_ages: string | null;
  other_pets: string | null;
  pets_sterilized: boolean | null;
  planned_move: boolean | null;
  expecting_family_change: boolean | null;
  hours_alone: string | null;
  previous_cats: string | null;
  why_adopt: string | null;
  extra_notes: string | null;
  interview_at: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface Adopter {
  id: string;
  application_id: string | null;
  cat_id: string | null;
  cat_name: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  adopted_on: string;
  followup_interval_days: number;
  next_followup_on: string | null;
  followup_active: boolean;
  notes: string | null;
}

export interface FollowupContact {
  id: string;
  adopter_id: string;
  contacted_at: string;
  channel: string;
  outcome: string;
  notes: string | null;
  by_profile: string | null;
}

export interface SponsorshipTier {
  id: string;
  name: string;
  monthly_mxn: number;
  description: string | null;
  perks: string[];
  visible: boolean;
  sort_order: number;
}

export interface Sponsorship {
  id: string;
  sponsor_id: string;
  cat_id: string;
  tier_id: string | null;
  status: SponsorshipStatus;
  payment_method: PaymentMethod;
  public_name: string | null;
  show_publicly: boolean;
  is_gift: boolean;
  gift_recipient: string | null;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface SponsorshipPayment {
  id: string;
  sponsorship_id: string;
  amount_mxn: number;
  paid_on: string;
  method: PaymentMethod;
  reference: string | null;
}

export interface SponsorMedia {
  id: string;
  cat_id: string;
  storage_path: string;
  media_type: "foto" | "video";
  caption: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  description: string | null;
  priority: WishlistPriority;
  quantity_needed: number | null;
  quantity_received: number;
  buy_url: string | null;
  visible: boolean;
  sort_order: number;
}

export interface AwarenessFact {
  id: string;
  headline: string;
  body: string | null;
  source: string | null;
  visible: boolean;
  sort_order: number;
}

export interface SterilizationResource {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  url: string | null;
  notes: string | null;
  visible: boolean;
  sort_order: number;
}

export interface ContactMessage {
  id: string;
  topic: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface CatInterest {
  id: string;
  cat_id: string;
  name: string;
  contact: string;
  notified: boolean;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  table_name: string;
  record_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  actor_id: string | null;
  summary: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

/** Resultado estándar de una acción de formulario del panel. */
export type ActionState = { ok: boolean; message: string } | null;
