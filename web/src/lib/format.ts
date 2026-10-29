import type { CatStatus, ScheduleDay, ScheduleException, SiteSettings } from "./types";

export const TZ = "America/Tijuana";

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/** Orden en que se muestra la semana: lunes primero. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const CAT_STATUS: Record<CatStatus, { label: string; tone: string; adoptable: boolean }> = {
  disponible: { label: "En adopción", tone: "bg-primary text-on-primary", adoptable: true },
  apartado: { label: "Apartado", tone: "bg-tertiary-container text-on-tertiary-container", adoptable: false },
  adoptado: { label: "Adoptado", tone: "bg-success-container text-on-success-container", adoptable: false },
  residente: { label: "Residente de casa", tone: "bg-secondary-container text-on-secondary-container", adoptable: false },
  en_tratamiento: { label: "En tratamiento", tone: "bg-error-container text-on-error-container", adoptable: false },
};

export function money(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: Number.isInteger(v) ? 0 : 2,
  }).format(v);
}

export function number(n: number) {
  return new Intl.NumberFormat("es-MX").format(n);
}

/** "2026-10-29" → "29 de octubre de 2026" (sin desfase de zona horaria). */
export function longDate(isoDate: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!isoDate) return "";
  const d = isoDate.length === 10 ? new Date(`${isoDate}T12:00:00Z`) : new Date(isoDate);
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: TZ, ...opts }).format(d);
}

export function shortDate(isoDate: string | null | undefined) {
  return longDate(isoDate, { year: undefined, month: "short" });
}

export function dateTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "13:00:00" → "1:00 pm" */
export function time12(t: string | null | undefined) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Fecha de hoy en Tijuana como "YYYY-MM-DD". */
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function tijuanaParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { weekday, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

type DayRule = { is_open: boolean; opens_at: string | null; closes_at: string | null; note: string | null };

function ruleFor(dateISO: string, weekday: number, week: ScheduleDay[], exceptions: ScheduleException[]): DayRule | undefined {
  return exceptions.find((e) => e.date === dateISO) ?? week.find((d) => d.day_of_week === weekday);
}

/**
 * Estado "Abierto ahora / Cerrado" calculado del horario semanal y los días especiales.
 * Devuelve el texto del chip, p. ej. "Cerrado por hoy · abrimos el jueves a las 12:00 pm".
 */
export function openStatus(week: ScheduleDay[], exceptions: ScheduleException[], now = new Date()) {
  if (!week.some((d) => d.is_open) && exceptions.length === 0) {
    return { open: false, known: false, label: "Horario por confirmar" };
  }
  const { weekday, minutes } = tijuanaParts(now);
  const today = todayISO(now);
  const rule = ruleFor(today, weekday, week, exceptions);

  if (rule?.is_open && rule.opens_at && rule.closes_at) {
    const o = toMinutes(rule.opens_at);
    const c = toMinutes(rule.closes_at);
    if (minutes >= o && minutes < c) {
      return { open: true, known: true, label: `Abierto ahora · cerramos a las ${time12(rule.closes_at)}` };
    }
    if (minutes < o) {
      return { open: false, known: true, label: `Abrimos hoy a las ${time12(rule.opens_at)}` };
    }
  }

  // Buscar el siguiente día abierto en los próximos 14 días
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const iso = todayISO(d);
    const wd = (weekday + i) % 7;
    const r = ruleFor(iso, wd, week, exceptions);
    if (r?.is_open && r.opens_at) {
      const when = i === 1 ? "mañana" : `el ${DAY_NAMES[wd].toLowerCase()}`;
      const reason = rule && !rule.is_open && rule.note ? ` (${rule.note})` : "";
      return { open: false, known: true, label: `Cerrado por hoy${reason} · abrimos ${when} a las ${time12(r.opens_at)}` };
    }
  }
  return { open: false, known: true, label: "Cerrado por ahora" };
}

export function catAge(birthDate: string | null, ageLabel: string | null, now = new Date()) {
  if (ageLabel) return ageLabel;
  if (!birthDate) return null;
  const b = new Date(`${birthDate}T12:00:00Z`);
  const months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (months < 1) return "Recién nacido";
  if (months < 12) return `${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "año" : "años"}`;
}

/** Etapa de vida para los filtros del catálogo. */
export function lifeStage(birthDate: string | null, ageLabel: string | null): "cachorro" | "joven" | "adulto" | "senior" | null {
  let months: number | null = null;
  if (birthDate) {
    const b = new Date(`${birthDate}T12:00:00Z`);
    const now = new Date();
    months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  } else if (ageLabel) {
    const m = ageLabel.match(/(\d+)\s*(mes|año|ano)/i);
    if (m) months = Number(m[1]) * (m[2].toLowerCase().startsWith("mes") ? 1 : 12);
  }
  if (months === null) return null;
  if (months < 12) return "cachorro";
  if (months < 36) return "joven";
  if (months < 96) return "adulto";
  return "senior";
}

export function whatsappLink(settings: Pick<SiteSettings, "whatsapp_number" | "phone">, message?: string) {
  const raw = settings.whatsapp_number || settings.phone || "";
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) digits = `52${digits}`; // número mexicano sin lada de país
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function telLink(phone: string | null | undefined) {
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** URL pública de una foto guardada en el bucket "publico" (o una URL completa de ejemplo). */
export function publicImage(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/publico/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const POST_CATEGORY_LABEL = {
  concientizacion: "Concientización",
  evento: "Evento",
  noticia: "Noticias",
  historia: "Historias de adopción",
  sorteo: "Sorteos",
} as const;

export const APPLICATION_STATUS_LABEL = {
  nueva: "Nueva",
  en_entrevista: "En entrevista",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  adoptada: "Adoptó",
  cancelada: "Cancelada",
} as const;

export const APPLICATION_STATUS_TONE = {
  nueva: "bg-primary text-on-primary",
  en_entrevista: "bg-tertiary-container text-on-tertiary-container",
  aprobada: "bg-success-container text-on-success-container",
  rechazada: "bg-surface-highest text-on-surface-variant",
  adoptada: "bg-success-container text-on-success-container",
  cancelada: "bg-surface-highest text-on-surface-variant",
} as const;

export const FOLLOWUP_CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  llamada: "Llamada",
  correo: "Correo",
  en_persona: "En persona",
  otro: "Otro",
};

export const FOLLOWUP_OUTCOME_LABEL: Record<string, string> = {
  todo_bien: "Todo bien",
  atencion: "Necesita atención",
  sin_respuesta: "No contestó",
  devolucion: "Lo devolvieron",
};

export const SPONSORSHIP_STATUS_LABEL = {
  pendiente: "Pendiente de pago",
  activa: "Activo",
  pausada: "En pausa",
  cancelada: "Terminado",
} as const;

export const SPONSORSHIP_STATUS_TONE = {
  pendiente: "bg-tertiary-container text-on-tertiary-container",
  activa: "bg-success-container text-on-success-container",
  pausada: "bg-surface-highest text-on-surface-variant",
  cancelada: "bg-surface-highest text-on-surface-variant",
} as const;

export const PAYMENT_METHOD_LABEL = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
} as const;

export const DIETARY_LABEL: Record<string, string> = {
  vegetariano: "veg",
  vegano: "vegano",
  lacteos: "lácteos",
  nueces: "nueces",
  gluten: "gluten",
  picante: "picante",
};
