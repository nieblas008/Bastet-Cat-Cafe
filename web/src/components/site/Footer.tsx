import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getSchedule, getSettings } from "@/lib/data";
import { DAY_NAMES, WEEK_ORDER, telLink, time12, whatsappLink } from "@/lib/format";
import { Brand } from "./Brand";

export async function Footer() {
  const [settings, { week }] = await Promise.all([getSettings(), getSchedule()]);
  const wa = whatsappLink(settings);
  const hasHours = week.some((d) => d.is_open);

  return (
    <footer className="mt-24 bg-inverse-surface text-inverse-on-surface">
      <div className="container-site grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="[&_*]:text-inverse-on-surface [&_span.text-primary]:!text-primary-container">
            <Brand />
          </div>
          <p className="mt-4 max-w-xs text-sm opacity-80">{settings.tagline}. Tu consumo mantiene el refugio.</p>
          <div className="mt-5 flex gap-2">
            {settings.instagram_url && (
              <a className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Icon name="instagram" />
              </a>
            )}
            {settings.facebook_url && (
              <a className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Icon name="facebook" />
              </a>
            )}
            {wa && (
              <a className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <Icon name="whatsapp" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold">Horario</h2>
          {hasHours ? (
            <ul className="mt-3 grid gap-1 text-sm opacity-90">
              {WEEK_ORDER.map((d) => {
                const day = week.find((w) => w.day_of_week === d);
                return (
                  <li key={d} className="flex justify-between gap-4">
                    <span>{DAY_NAMES[d]}</span>
                    <span>{day?.is_open ? `${time12(day.opens_at)} – ${time12(day.closes_at)}` : "Cerrado"}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm opacity-80">Consulta nuestro horario en Instagram.</p>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold">Encuéntranos</h2>
          <ul className="mt-3 grid gap-2 text-sm opacity-90">
            {settings.address && <li>{settings.address}</li>}
            {settings.maps_url && (
              <li>
                <a href={settings.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-4">
                  <Icon name="map" size={16} /> Cómo llegar
                </a>
              </li>
            )}
            {settings.phone && (
              <li>
                <a href={telLink(settings.phone)!} className="inline-flex items-center gap-1.5">
                  <Icon name="phone" size={16} /> {settings.phone}
                </a>
              </li>
            )}
            {settings.email && <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold">El sitio</h2>
          <ul className="mt-3 grid gap-2 text-sm opacity-90">
            <li><Link href="/gatos">Gatos en adopción</Link></li>
            <li><Link href="/adoptar">Cómo adoptar</Link></li>
            <li><Link href="/ayudar">Otras formas de ayudar</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
            <li><Link href="/padrino">Portal de padrinos</Link></li>
            <li><Link href="/aviso-de-privacidad">Aviso de privacidad</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-wrap items-center justify-between gap-2 py-5 text-xs opacity-70">
          <span>© {new Date().getFullYear()} {settings.cafe_name} · Tijuana, Baja California</span>
          <Link href="/panel" className="hover:underline">Acceso del equipo</Link>
        </div>
      </div>
    </footer>
  );
}
