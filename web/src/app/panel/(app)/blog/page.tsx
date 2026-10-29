import Link from "next/link";
import { Empty, PanelTitle } from "@/components/panel/PanelBits";
import { Icon } from "@/components/ui/Icon";
import { dateTime, POST_CATEGORY_LABEL, shortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

export const metadata = { title: "Blog y eventos" };

export default async function BlogAdmin() {
  const sb = await createClient();
  const { data } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(200);
  const posts = (data as Post[]) ?? [];
  const now = new Date().toISOString();
  return (
    <>
      <PanelTitle
        title="Blog y eventos"
        intro="Noticias, eventos, historias de adopción, sorteos y concientización. Lo publicado aparece en /blog; los eventos también en el inicio."
        action={<Link href="/panel/blog/nuevo" className="btn btn-sm"><Icon name="plus" size={18} /> Nueva entrada</Link>}
      />
      {posts.length === 0 ? (
        <Empty>Todavía no hay entradas.</Empty>
      ) : (
        <ul className="grid gap-3">
          {posts.map((p) => {
            const scheduled = p.status === "publicado" && p.published_at && p.published_at > now;
            return (
              <li key={p.id}>
                <Link href={`/panel/blog/${p.id}`} className="flex flex-wrap items-center gap-3 rounded-[20px] border border-outline-variant bg-white p-4 hover:border-primary">
                  <span className={`chip text-xs ${p.status === "publicado" ? (scheduled ? "bg-tertiary-container text-on-tertiary-container" : "bg-success-container text-on-success-container") : "bg-surface-highest"}`}>
                    {p.status === "borrador" ? "Borrador" : scheduled ? "Programada" : "Publicada"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{p.pinned && "📌 "}{p.title}</span>
                    <span className="block text-sm text-on-surface-variant">
                      {POST_CATEGORY_LABEL[p.category]}
                      {p.event_starts_at ? ` · ${dateTime(p.event_starts_at)}` : p.published_at ? ` · ${shortDate(p.published_at)}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
