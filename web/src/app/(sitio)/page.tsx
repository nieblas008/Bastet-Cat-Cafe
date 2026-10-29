import Image from "next/image";
import Link from "next/link";
import { AdoptionCounter, CatCard, CatImage, SectionHeading } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import {
  getAdoptedCats,
  getAwareness,
  getBlock,
  getCats,
  getMenu,
  getPosts,
  getSchedule,
  getSettings,
  getSponsorCounts,
  getTiers,
  getUpcomingEvents,
  getWishlist,
} from "@/lib/data";
import { DAY_NAMES, WEEK_ORDER, dateTime, money, time12, todayISO } from "@/lib/format";

export default async function HomePage() {
  const [settings, hero, firstVisit, cats, adopted, { week, exceptions }, menu, events, wishlist, tiers, { facts }, sponsors, pinned] =
    await Promise.all([
      getSettings(),
      getBlock("inicio_hero"),
      getBlock("inicio_primera_visita"),
      getCats(),
      getAdoptedCats(8),
      getSchedule(),
      getMenu(),
      getUpcomingEvents(3),
      getWishlist(),
      getTiers(),
      getAwareness(),
      getSponsorCounts(),
      getPosts({ category: "concientizacion", limit: 1 }),
    ]);

  const adoptable = cats.filter((c) => c.status === "disponible" || c.status === "apartado");
  const hasHours = week.some((d) => d.is_open);
  const featuredMenu = menu.flatMap((c) => c.items).filter((i) => i.badge).slice(0, 4);
  const menuPreview = featuredMenu.length ? featuredMenu : menu.flatMap((c) => c.items).slice(0, 4);
  const today = todayISO();

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="/img/fachada.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,248,.05)_0%,rgba(255,240,242,.35)_60%,rgba(255,248,248,.96)_100%),linear-gradient(90deg,rgba(255,240,242,.55)_0%,rgba(255,240,242,0)_70%)]" />
        </div>
        <div className="container-site grid min-h-[78svh] items-center gap-8 py-16 md:grid-cols-[1.1fr_.9fr]">
          <div className="animate-rise max-w-[640px] rounded-[36px] border border-white/70 bg-surface/85 p-7 shadow-[0_30px_60px_-30px_rgba(62,0,29,.35)] backdrop-blur-xl md:p-10">
            <span className="chip bg-primary-container text-on-primary-container">
              <span className="size-2 rounded-full bg-primary" /> Café · refugio felino · Tijuana
            </span>
            <h1 className="font-display mt-5 text-[44px] font-extrabold leading-[.98] md:text-[72px]">
              {hero?.title ?? "Ven por el café. Quédate por los michis."}
            </h1>
            <Markdown text={hero?.body} className="mt-4 text-lg text-on-surface-variant [&>p+p]:mt-3" />
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/gatos" className="btn">
                <Icon name="paw" /> Conoce a los gatos
              </Link>
              <Link href="/menu" className="btn btn-tonal">
                <Icon name="coffee" /> Ver el menú
              </Link>
              <Link href="/visitanos" className="btn btn-outlined">
                Visítanos
              </Link>
            </div>
          </div>
          {settings.show_adoptions_counter && settings.adoptions_count > 0 && (
            <div className="animate-rise md:justify-self-end md:self-end" style={{ animationDelay: ".15s" }}>
              <AdoptionCounter count={settings.adoptions_count} goal={settings.adoptions_goal} asOf={settings.adoptions_count_as_of} />
            </div>
          )}
        </div>
      </section>

      {/* ── Gatitos buscando familia ── */}
      <section className="container-site mt-16">
        <SectionHeading
          eyebrow="En adopción"
          title="Michis buscando familia"
          intro={
            adoptable.length
              ? `${adoptable.length} ${adoptable.length === 1 ? "gato está" : "gatos están"} esperando un hogar. Todos viven en el café: ven a conocerlos.`
              : null
          }
          action={
            <Link href="/gatos" className="btn btn-outlined">
              Ver a todos <Icon name="arrow" size={18} />
            </Link>
          }
        />
        {adoptable.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {adoptable.slice(0, 8).map((cat, i) => (
              <CatCard key={cat.id} cat={cat} index={i} sponsors={sponsors[cat.id] ?? 0} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] bg-success-container p-8 text-on-success-container">
            <p className="font-display text-2xl font-bold">¡Todos encontraron casa! 🎉</p>
            <p className="mt-2 max-w-xl">Por ahora no hay gatos en adopción. Pronto llegan más: síguenos en Instagram para enterarte.</p>
          </div>
        )}
      </section>

      {/* ── Primera vez + horario ── */}
      {(firstVisit || hasHours) && (
        <section className="container-site mt-20 grid gap-6 lg:grid-cols-2">
          {firstVisit && (
            <div className="rounded-[28px] bg-tertiary-container p-7 text-on-tertiary-container md:p-9">
              <h2 className="font-display text-3xl font-extrabold">{firstVisit.title}</h2>
              <Markdown text={firstVisit.body} className="prose-bastet mt-4 !text-[16px]" />
              <Link href="/visitanos" className="btn btn-outlined mt-6 !border-on-tertiary-container/40 !text-on-tertiary-container">
                Cómo funciona una visita
              </Link>
            </div>
          )}
          {hasHours && (
            <div className="card p-7 md:p-9">
              <h2 className="font-display text-3xl font-extrabold">Horario de la semana</h2>
              <ul className="mt-5 divide-y divide-outline-variant/70">
                {WEEK_ORDER.map((d) => {
                  const day = week.find((w) => w.day_of_week === d);
                  const isToday = new Date(`${today}T12:00:00Z`).getUTCDay() === d;
                  return (
                    <li key={d} className="flex items-center justify-between gap-4 py-3">
                      <span className="flex items-center gap-2 font-semibold">
                        {DAY_NAMES[d]}
                        {isToday && <span className="chip bg-primary !px-2 !py-0.5 !text-[11px] text-on-primary">HOY</span>}
                      </span>
                      <span className="text-right text-sm">
                        {day?.is_open ? `${time12(day.opens_at)} – ${time12(day.closes_at)}` : <span className="text-error">Cerrado</span>}
                        {day?.note && <span className="block text-xs text-on-surface-variant">{day.note}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {exceptions.length > 0 && (
                <div className="mt-4 rounded-2xl bg-surface-mid p-4 text-sm">
                  <p className="font-semibold">Días especiales</p>
                  <ul className="mt-1 grid gap-1">
                    {exceptions.slice(0, 4).map((e) => (
                      <li key={e.date}>
                        {new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${e.date}T12:00:00Z`))}
                        : {e.is_open ? `${time12(e.opens_at)} – ${time12(e.closes_at)}` : "cerrado"}
                        {e.note ? ` · ${e.note}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Del menú ── */}
      {menuPreview.length > 0 && (
        <section className="container-site mt-20">
          <SectionHeading
            eyebrow="Del menú"
            title="Tu consumo mantiene el refugio"
            action={
              <Link href="/menu" className="btn btn-outlined">
                Menú completo <Icon name="arrow" size={18} />
              </Link>
            }
          />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {menuPreview.map((item) => (
              <li key={item.id} className="card flex flex-col p-5">
                <span className="font-display text-lg font-bold">{item.name}</span>
                {item.description && <span className="mt-1 text-sm text-on-surface-variant">{item.description}</span>}
                <span className="mt-auto pt-4 font-display text-xl font-extrabold text-primary">{money(item.price_mxn)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Concientización ── */}
      {facts.length > 0 && (
        <section className="mt-20 bg-inverse-surface py-16 text-inverse-on-surface">
          <div className="container-site">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary-container">Concientización</p>
            <h2 className="font-display mt-2 max-w-2xl text-3xl font-extrabold md:text-[40px] md:leading-[1.05]">
              Una gata sin esterilizar no es un gato. Es una colonia.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {facts.slice(0, 3).map((f) => (
                <div key={f.id} className="rounded-[24px] bg-white/8 p-6 ring-1 ring-white/10">
                  <p className="font-display text-3xl font-extrabold text-primary-container">{f.headline}</p>
                  {f.body && <p className="mt-2 opacity-85">{f.body}</p>}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/concientizacion#calculadora" className="btn">
                Haz la cuenta tú mismo
              </Link>
              {pinned[0] && (
                <Link href={`/blog/${pinned[0].slug}`} className="btn btn-outlined !border-white/40 !text-inverse-on-surface">
                  Leer: {pinned[0].title}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Apadrina + lo que necesitamos ── */}
      {(tiers.length > 0 || wishlist.length > 0) && (
        <section className="container-site mt-20 grid gap-6 lg:grid-cols-2">
          {tiers.length > 0 && (
            <div className="rounded-[28px] bg-primary-container p-7 text-on-primary-container md:p-9">
              <p className="text-xs font-bold uppercase tracking-[.14em]">Apadrina</p>
              <h2 className="font-display mt-2 text-3xl font-extrabold">Si no puedes adoptar, apadrina</h2>
              <p className="mt-3">
                Con una aportación mensual cubres la comida y los cuidados de un michi, y recibes fotos y videos que solo ven sus padrinos.
              </p>
              <p className="mt-4 font-semibold">Desde {money(Math.min(...tiers.map((t) => Number(t.monthly_mxn))))} al mes.</p>
              <Link href="/apadrina" className="btn mt-6">
                <Icon name="heart" /> Conoce los niveles
              </Link>
            </div>
          )}
          {wishlist.length > 0 && (
            <div className="card p-7 md:p-9">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Lo que necesitamos</p>
              <h2 className="font-display mt-2 text-3xl font-extrabold">Esta temporada nos hace falta</h2>
              <ul className="mt-5 grid gap-3">
                {wishlist.slice(0, 4).map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-low px-4 py-3">
                    <span>
                      <span className="font-semibold">{w.name}</span>
                      {w.description && <span className="block text-sm text-on-surface-variant">{w.description}</span>}
                    </span>
                    {w.priority === "urgente" && <span className="chip bg-error-container text-on-error-container">Urgente</span>}
                  </li>
                ))}
              </ul>
              <Link href="/ayudar" className="btn btn-outlined mt-6">
                Otras formas de ayudar
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── Próximos eventos ── */}
      {events.length > 0 && (
        <section className="container-site mt-20">
          <SectionHeading
            eyebrow="Eventos"
            title="Próximamente en Bastet"
            action={
              <Link href="/blog?categoria=evento" className="btn btn-outlined">
                Todos los eventos
              </Link>
            }
          />
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/blog/${e.slug}`} className="card block h-full p-6 hover:bg-surface-low">
                  <span className="chip bg-tertiary-container text-on-tertiary-container">
                    <Icon name="calendar" size={14} /> {dateTime(e.event_starts_at)}
                  </span>
                  <h3 className="font-display mt-4 text-xl font-bold">{e.title}</h3>
                  {e.excerpt && <p className="mt-2 text-sm text-on-surface-variant">{e.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Ya tienen casa ── */}
      {adopted.length > 0 && (
        <section className="container-site mt-20">
          <SectionHeading eyebrow="El muro de los adoptados" title="Ya se fueron a casa" />
          <ul className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4">
            {adopted.map((cat, i) => (
              <li key={cat.id} className="w-40 shrink-0 snap-start text-center">
                <CatImage cat={cat} index={i} sizes="160px" />
                <p className="font-display mt-2 font-bold">{cat.name}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
