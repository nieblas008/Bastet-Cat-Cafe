import { PanelNav, type NavItem } from "@/components/panel/PanelNav";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: { default: "Panel", template: "%s · Panel de Bastet" }, robots: { index: false } };

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const profile = await requireStaff();
  const sb = await createClient();
  const [{ count: newApps }, { count: newMsgs }, { count: pendingSponsors }] = await Promise.all([
    sb.from("adoption_applications").select("id", { count: "exact", head: true }).eq("status", "nueva"),
    sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
    sb.from("sponsorships").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
  ]);

  const items: NavItem[] = [
    { href: "/panel", label: "Inicio", icon: "home" },
    { href: "/panel/gatos", label: "Gatos", icon: "paw" },
    { href: "/panel/horario", label: "Horario", icon: "clock" },
    { href: "/panel/menu", label: "Menú", icon: "coffee" },
    { href: "/panel/solicitudes", label: "Solicitudes", icon: "inbox", badge: newApps ?? 0 },
    { href: "/panel/seguimiento", label: "Seguimiento", icon: "bell" },
    { href: "/panel/blog", label: "Blog y eventos", icon: "book" },
    { href: "/panel/apadrinamiento", label: "Apadrinamiento", icon: "heart", badge: pendingSponsors ?? 0 },
    { href: "/panel/necesidades", label: "Lo que necesitamos", icon: "gift" },
    { href: "/panel/mensajes", label: "Mensajes", icon: "whatsapp", badge: newMsgs ?? 0 },
    { href: "/panel/textos", label: "Textos del sitio", icon: "edit" },
    { href: "/panel/ajustes", label: "Datos del café", icon: "settings" },
    { href: "/panel/qr", label: "QR del menú", icon: "qr" },
    { href: "/panel/equipo", label: "Equipo", icon: "team", adminOnly: true },
    { href: "/panel/historial", label: "Historial", icon: "history" },
  ];

  return (
    <div className="min-h-svh bg-surface lg:flex">
      <PanelNav items={items} isAdmin={profile.role === "admin"} name={profile.full_name} />
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}
