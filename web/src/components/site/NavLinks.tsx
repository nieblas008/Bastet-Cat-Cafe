"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-[14px] font-medium transition-colors xl:px-3.5 ${active ? "bg-primary-container font-semibold text-on-primary-container" : "hover:bg-surface-high"}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
