// Orden de las pestañas del sitio.
// El orden final lo deciden Elizabeth y Angie (pendiente #1 de la wiki):
// basta con reordenar este arreglo.
export const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/gatos", label: "Gatitos" },
  { href: "/adoptar", label: "Adoptar" },
  { href: "/menu", label: "Menú" },
  { href: "/visitanos", label: "Visítanos" },
  { href: "/concientizacion", label: "Concientización" },
  { href: "/blog", label: "Blog y eventos" },
  { href: "/apadrina", label: "Apadrina" },
  { href: "/nosotros", label: "Nosotros" },
] as const;

export const NAV_CTA = { href: "/ayudar", label: "Apoya" };
