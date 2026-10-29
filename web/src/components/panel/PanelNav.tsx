"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type NavItem = { href: string; label: string; icon: string; badge?: number; adminOnly?: boolean };

export function PanelNav({ items, isAdmin, name }: { items: NavItem[]; isAdmin: boolean; name: string }) {
  const pathname = usePathname();
  // El menú se cierra solo al cambiar de página: guarda en qué página se abrió
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const visible = items.filter((i) => !i.adminOnly || isAdmin);
  const isActive = (href: string) => (href === "/panel" ? pathname === "/panel" : pathname.startsWith(href));

  const list = (
    <ul className="grid gap-1">
      {visible.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-[15px] font-semibold ${isActive(item.href) ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-high"}`}
          >
            <Icon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className="chip bg-primary !px-2 !py-0.5 text-[12px] text-on-primary">{item.badge}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );

  const footer = (
    <div className="mt-6 grid gap-2 border-t border-outline-variant pt-4 text-sm">
      <p className="px-4 text-on-surface-variant">Hola, {name || "equipo"}</p>
      <Link href="/" target="_blank" className="flex min-h-11 items-center gap-3 rounded-2xl px-4 hover:bg-surface-high"><Icon name="eye" /> Ver el sitio</Link>
      <Link href="/panel/cuenta" className="flex min-h-11 items-center gap-3 rounded-2xl px-4 hover:bg-surface-high"><Icon name="user" /> Mi cuenta</Link>
      <form action="/auth/salir" method="post">
        <button className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 hover:bg-surface-high"><Icon name="logout" /> Salir</button>
      </form>
    </div>
  );

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-svh w-72 shrink-0 overflow-y-auto border-r border-outline-variant bg-surface-low p-4 lg:block">
        <Link href="/panel" className="mb-6 flex items-center gap-3 px-2 pt-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-brand text-white"><Icon name="paw" /></span>
          <span className="font-display text-xl font-extrabold">Panel de Bastet</span>
        </Link>
        {list}
        {footer}
      </aside>

      {/* Celular */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link href="/panel" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Icon name="paw" size={18} /></span>
          <span className="font-display text-lg font-extrabold">Panel</span>
        </Link>
        <button type="button" className="btn btn-tonal btn-sm !px-3" onClick={() => setOpenAt(open ? null : pathname)} aria-expanded={open}>
          <Icon name={open ? "close" : "menu"} /> <span className="sr-only">Menú</span>
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto bg-surface p-4 lg:hidden">
          {list}
          {footer}
        </div>
      )}
    </>
  );
}
