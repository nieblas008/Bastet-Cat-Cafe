import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { getPosts, getUpcomingEvents } from "@/lib/data";
import { POST_CATEGORY_LABEL, dateTime, publicImage, shortDate } from "@/lib/format";
import type { PostCategory } from "@/lib/types";

export const metadata: Metadata = { title: "Blog y eventos", description: "Eventos, campañas y noticias de Bastet Cat Café." };

const CATS = Object.entries(POST_CATEGORY_LABEL) as [PostCategory, string][];

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const { categoria } = await searchParams;
  const category = typeof categoria === "string" && categoria in POST_CATEGORY_LABEL ? categoria : undefined;
  const [posts, upcoming] = await Promise.all([getPosts({ category }), category ? Promise.resolve([]) : getUpcomingEvents(3)]);

  return (
    <>
      <PageHero eyebrow="Blog" title="Blog y eventos" intro="Lo que pasa en Bastet: eventos, campañas y las historias de quienes ya se fueron a casa." />
      <nav className="container-site flex flex-wrap gap-2" aria-label="Categorías">
        <Link href="/blog" className={`chip min-h-10 border ${!category ? "border-primary bg-primary-container" : "border-outline-variant bg-white"}`}>Todo</Link>
        {CATS.map(([k, l]) => (
          <Link key={k} href={`/blog?categoria=${k}`} className={`chip min-h-10 border ${category === k ? "border-primary bg-primary-container" : "border-outline-variant bg-white"}`}>{l}</Link>
        ))}
      </nav>

      {upcoming.length > 0 && (
        <section className="container-site mt-10">
          <h2 className="font-display text-2xl font-extrabold">Próximos eventos</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {upcoming.map((e) => (
              <li key={e.id}>
                <Link href={`/blog/${e.slug}`} className="block h-full rounded-[24px] bg-tertiary-container p-6 text-on-tertiary-container">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold"><Icon name="calendar" size={16} /> {dateTime(e.event_starts_at)}</span>
                  <p className="font-display mt-2 text-xl font-bold">{e.title}</p>
                  {e.event_location && <p className="mt-1 text-sm">{e.event_location}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-site mt-10">
        {posts.length === 0 ? (
          <p className="rounded-[24px] bg-surface-mid p-8">Todavía no hay publicaciones aquí.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => {
              const img = publicImage(p.cover_path);
              return (
                <li key={p.id}>
                  <Link href={`/blog/${p.slug}`} className="card group flex h-full flex-col overflow-hidden hover:shadow-lg">
                    <div className="relative aspect-[16/10] bg-surface-high">
                      {img ? (
                        <Image src={img} alt="" fill sizes="(min-width:1024px) 380px, 92vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="grid size-full place-items-center text-primary/40"><Icon name="paw" size={56} /></div>
                      )}
                      {p.pinned && <span className="chip absolute left-3 top-3 bg-primary text-on-primary">Fijada</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-bold uppercase tracking-[.12em] text-primary">{POST_CATEGORY_LABEL[p.category]}</p>
                      <h2 className="font-display mt-1 text-xl font-bold">{p.title}</h2>
                      {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">{p.excerpt}</p>}
                      <p className="mt-auto pt-4 text-xs text-on-surface-variant">
                        {p.category === "evento" && p.event_starts_at ? dateTime(p.event_starts_at) : shortDate(p.published_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
