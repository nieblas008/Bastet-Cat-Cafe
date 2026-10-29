import "server-only";
import { cache } from "react";
import { createPublicClient } from "./supabase/public";
import type {
  AdoptionRequirement,
  AwarenessFact,
  CatWithPhotos,
  Faq,
  MenuCategory,
  MenuItem,
  PageBlock,
  Post,
  ScheduleDay,
  ScheduleException,
  SiteSettings,
  SponsorshipTier,
  SterilizationResource,
  WishlistItem,
} from "./types";
import { todayISO } from "./format";

// Lecturas del sitio público. Si Supabase no está configurado (p. ej. durante
// el primer build), regresan vacío en lugar de romper la página.

const DEFAULT_SETTINGS: SiteSettings = {
  cafe_name: "Bastet Cat Café",
  tagline: "Café de especialidad y refugio felino en Tijuana",
  address: null,
  maps_url: null,
  maps_embed_url: null,
  phone: null,
  whatsapp_number: null,
  email: null,
  applications_email: null,
  instagram_url: "https://www.instagram.com/bastetcatcafe",
  facebook_url: null,
  tiktok_url: null,
  adoption_fee_mxn: 800,
  show_adoption_fee: true,
  adoption_response_days: null,
  online_applications: true,
  adoptions_count: 0,
  adoptions_count_as_of: null,
  adoptions_goal: 10000,
  show_adoptions_counter: false,
  entry_fee_note: null,
  bank_name: null,
  bank_account_holder: null,
  bank_clabe: null,
  bank_card_number: null,
  donations_note: null,
  updated_at: new Date(0).toISOString(),
};

const CAT_SELECT = "*, cat_photos(*), cat_groups(*)";

function sortPhotos<T extends CatWithPhotos>(cats: T[]) {
  cats.forEach((c) => c.cat_photos?.sort((a, b) => a.sort_order - b.sort_order));
  return cats;
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const sb = createPublicClient();
  if (!sb) return DEFAULT_SETTINGS;
  const { data } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (data as SiteSettings) ?? DEFAULT_SETTINGS;
});

export const getBlocks = cache(async (): Promise<Record<string, PageBlock>> => {
  const sb = createPublicClient();
  if (!sb) return {};
  const { data } = await sb.from("page_blocks").select("*").eq("visible", true);
  return Object.fromEntries(((data as PageBlock[]) ?? []).map((b) => [b.key, b]));
});

/** Un bloque solo "existe" para el sitio si tiene texto. */
export async function getBlock(key: string) {
  const blocks = await getBlocks();
  const b = blocks[key];
  return b && b.body.trim() ? b : null;
}

export const getSchedule = cache(async (): Promise<{ week: ScheduleDay[]; exceptions: ScheduleException[] }> => {
  const sb = createPublicClient();
  if (!sb) return { week: [], exceptions: [] };
  const [{ data: week }, { data: exceptions }] = await Promise.all([
    sb.from("weekly_schedule").select("*").order("day_of_week"),
    sb.from("schedule_exceptions").select("*").gte("date", todayISO()).order("date").limit(20),
  ]);
  return { week: (week as ScheduleDay[]) ?? [], exceptions: (exceptions as ScheduleException[]) ?? [] };
});

export const getCats = cache(async (): Promise<CatWithPhotos[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb
    .from("cats")
    .select(CAT_SELECT)
    .eq("published", true)
    .neq("status", "adoptado")
    .order("featured", { ascending: false })
    .order("sort_order")
    .order("arrived_at", { ascending: true });
  return sortPhotos((data as CatWithPhotos[]) ?? []);
});

export const getAdoptedCats = cache(async (limit = 24): Promise<CatWithPhotos[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb
    .from("cats")
    .select(CAT_SELECT)
    .eq("published", true)
    .eq("status", "adoptado")
    .order("adopted_at", { ascending: false })
    .limit(limit);
  return sortPhotos((data as CatWithPhotos[]) ?? []);
});

export const getCat = cache(async (slug: string): Promise<CatWithPhotos | null> => {
  const sb = createPublicClient();
  if (!sb) return null;
  const { data } = await sb.from("cats").select(CAT_SELECT).eq("slug", slug).eq("published", true).maybeSingle();
  if (!data) return null;
  return sortPhotos([data as CatWithPhotos])[0];
});

export const getGroupMates = cache(async (groupId: string, exceptId: string): Promise<CatWithPhotos[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb
    .from("cats")
    .select(CAT_SELECT)
    .eq("group_id", groupId)
    .eq("published", true)
    .neq("id", exceptId);
  return sortPhotos((data as CatWithPhotos[]) ?? []);
});

export const getSponsorCounts = cache(async (): Promise<Record<string, number>> => {
  const sb = createPublicClient();
  if (!sb) return {};
  const { data } = await sb.rpc("cat_sponsor_counts");
  return Object.fromEntries(((data as { cat_id: string; sponsors: number }[]) ?? []).map((r) => [r.cat_id, r.sponsors]));
});

export const getMenu = cache(async (): Promise<(MenuCategory & { items: MenuItem[] })[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const [{ data: cats }, { data: items }] = await Promise.all([
    sb.from("menu_categories").select("*").eq("visible", true).order("sort_order"),
    sb.from("menu_items").select("*").eq("visible", true).order("sort_order").order("name"),
  ]);
  const list = (items as MenuItem[]) ?? [];
  return ((cats as MenuCategory[]) ?? [])
    .map((c) => ({ ...c, items: list.filter((i) => i.category_id === c.id) }))
    .filter((c) => c.items.length > 0);
});

export const getPosts = cache(async (opts: { category?: string; limit?: number } = {}): Promise<Post[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  let q = sb
    .from("posts")
    .select("*")
    .eq("status", "publicado")
    .lte("published_at", new Date().toISOString())
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data as Post[]) ?? [];
});

export const getUpcomingEvents = cache(async (limit = 3): Promise<Post[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb
    .from("posts")
    .select("*")
    .eq("status", "publicado")
    .eq("category", "evento")
    .gte("event_starts_at", new Date(Date.now() - 6 * 3600 * 1000).toISOString())
    .order("event_starts_at")
    .limit(limit);
  return (data as Post[]) ?? [];
});

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const sb = createPublicClient();
  if (!sb) return null;
  const { data } = await sb
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publicado")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  return (data as Post) ?? null;
});

export const getRequirements = cache(async (): Promise<AdoptionRequirement[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb.from("adoption_requirements").select("*").order("sort_order");
  return (data as AdoptionRequirement[]) ?? [];
});

export const getFaqs = cache(async (topic?: Faq["topic"]): Promise<Faq[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  let q = sb.from("faqs").select("*").eq("visible", true).order("sort_order");
  if (topic) q = q.eq("topic", topic);
  const { data } = await q;
  return (data as Faq[]) ?? [];
});

export const getTiers = cache(async (): Promise<SponsorshipTier[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb.from("sponsorship_tiers").select("*").eq("visible", true).order("sort_order");
  return (data as SponsorshipTier[]) ?? [];
});

export const getSponsorWall = cache(async () => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb.rpc("sponsor_wall");
  return (data as { public_name: string; cat_name: string; cat_slug: string; started_at: string | null }[]) ?? [];
});

export const getWishlist = cache(async (): Promise<WishlistItem[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb.from("wishlist_items").select("*").eq("visible", true).order("sort_order");
  const order = { urgente: 0, normal: 1, cuando_se_pueda: 2 } as const;
  return ((data as WishlistItem[]) ?? []).sort((a, b) => order[a.priority] - order[b.priority] || a.sort_order - b.sort_order);
});

export const getAwareness = cache(async (): Promise<{ facts: AwarenessFact[]; resources: SterilizationResource[] }> => {
  const sb = createPublicClient();
  if (!sb) return { facts: [], resources: [] };
  const [{ data: facts }, { data: resources }] = await Promise.all([
    sb.from("awareness_facts").select("*").eq("visible", true).order("sort_order"),
    sb.from("sterilization_resources").select("*").eq("visible", true).order("sort_order"),
  ]);
  return { facts: (facts as AwarenessFact[]) ?? [], resources: (resources as SterilizationResource[]) ?? [] };
});
