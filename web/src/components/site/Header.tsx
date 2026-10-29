import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getSchedule, getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/format";
import { NAV_CTA } from "@/lib/nav";
import { Brand } from "./Brand";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { OpenChip } from "./OpenChip";

export async function Header() {
  const [settings, { week, exceptions }] = await Promise.all([getSettings(), getSchedule()]);
  const wa = whatsappLink(settings);
  const igHandle = settings.instagram_url?.match(/instagram\.com\/([^/?]+)/)?.[1];

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface/90 backdrop-blur-md">
      <div className="hidden bg-surface-mid text-on-surface-variant md:block">
        <div className="container-site flex h-9 items-center justify-between gap-4">
          <OpenChip week={week} exceptions={exceptions} />
          <div className="flex items-center gap-5 text-[13px] font-semibold">
            {igHandle && (
              <a href={settings.instagram_url!} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                @{igHandle}
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {settings.phone ?? "WhatsApp"} · WhatsApp
              </a>
            )}
            <Link href="/padrino" className="inline-flex items-center gap-1.5 hover:underline">
              <Icon name="user" size={16} /> Padrinos
            </Link>
          </div>
        </div>
      </div>
      <nav className="container-site flex h-[72px] items-center justify-between gap-4" aria-label="Principal">
        <Brand />
        <NavLinks />
        <div className="flex items-center gap-2">
          <Link href={NAV_CTA.href} className="btn btn-sm hidden sm:inline-flex">
            <Icon name="heart" size={18} /> {NAV_CTA.label}
          </Link>
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
