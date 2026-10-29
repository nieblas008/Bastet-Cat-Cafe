import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButton } from "@/components/site/ShareButton";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { getPost, getSettings } from "@/lib/data";
import { POST_CATEGORY_LABEL, dateTime, longDate, publicImage } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Publicación no encontrada" };
  const img = publicImage(post.cover_path);
  return { title: post.title, description: post.excerpt ?? undefined, openGraph: { type: "article", images: img ? [{ url: img }] : undefined } };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPost(slug), getSettings()]);
  if (!post) notFound();
  const img = publicImage(post.cover_path);
  const isEvent = post.category === "evento";
  const isPast = isEvent && post.event_starts_at && new Date(post.event_ends_at ?? post.event_starts_at) < new Date();
  const ctaUrl = post.cta_url ?? (post.category === "sorteo" ? settings.instagram_url : null);
  const ctaLabel = post.cta_label ?? (post.category === "sorteo" ? "Participa en Instagram" : null);

  return (
    <article className="container-site max-w-3xl pt-10">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><Icon name="back" size={16} /> Blog</Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-primary">{POST_CATEGORY_LABEL[post.category]}</p>
      <h1 className="font-display mt-2 text-4xl font-extrabold leading-tight md:text-5xl">{post.title}</h1>
      <p className="mt-3 text-sm text-on-surface-variant">{longDate(post.published_at)}</p>

      {isEvent && post.event_starts_at && (
        <div className={`mt-6 rounded-[24px] p-5 ${isPast ? "bg-surface-high" : "bg-tertiary-container text-on-tertiary-container"}`}>
          <p className="inline-flex items-center gap-2 font-semibold"><Icon name="calendar" /> {dateTime(post.event_starts_at)}{post.event_ends_at ? ` – ${dateTime(post.event_ends_at)}` : ""}</p>
          {post.event_location && <p className="mt-1">{post.event_location}</p>}
          {isPast && <p className="mt-1 text-sm">Este evento ya pasó.</p>}
        </div>
      )}

      {img && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[28px]">
          <Image src={img} alt="" fill priority sizes="(min-width: 768px) 768px, 92vw" className="object-cover" />
        </div>
      )}

      <Markdown text={post.body} className="prose-bastet mt-8" />

      {ctaUrl && ctaLabel && (
        <div className="mt-10 rounded-[28px] bg-primary-container p-7 text-on-primary-container">
          <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="btn">{ctaLabel} <Icon name="arrow" size={18} /></a>
        </div>
      )}

      <div className="mt-10 flex gap-3">
        <ShareButton title={post.title} text={post.excerpt ?? undefined} />
      </div>
    </article>
  );
}
