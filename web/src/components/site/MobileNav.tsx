"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { NAV, NAV_CTA } from "@/lib/nav";

export function MobileNav() {
  // El menú se cierra solo al cambiar de página: guarda en qué página se abrió
  const [openAt, setOpenAt] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openAt === pathname;
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <div className="lg:hidden">
      <button type="button" className="btn btn-tonal btn-sm !px-3" aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpenAt(open ? null : pathname)}>
        <Icon name={open ? "close" : "menu"} />
        <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
      </button>
      {open && (
        <nav id="menu-movil" className="fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto bg-surface px-4 pb-10 pt-4 animate-rise">
          <ul className="grid gap-1">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-14 items-center rounded-2xl px-4 text-lg font-semibold ${active ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-high"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li><Link href="/contacto" className="flex min-h-14 items-center rounded-2xl px-4 text-lg font-semibold hover:bg-surface-high">Contacto</Link></li>
          </ul>
          <Link href={NAV_CTA.href} className="btn mt-6 w-full">
            <Icon name="heart" /> {NAV_CTA.label}
          </Link>
        </nav>
      )}
    </div>
  );
}
