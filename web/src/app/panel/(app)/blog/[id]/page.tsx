import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { Icon } from "@/components/ui/Icon";
import { publicImage } from "@/lib/format";
import { isoToTijuanaLocal } from "@/lib/panel";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { PhotoUploader } from "../../gatos/PhotoUploader";
import { deletePost, removeCover, setCover, updatePost } from "../actions";
import { PostForm } from "../PostForm";

export const metadata = { title: "Editar entrada" };

export default async function EditarEntrada({ params, searchParams }: PageProps<"/panel/blog/[id]">) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const sb = await createClient();
  const [{ data }, { data: cats }] = await Promise.all([
    sb.from("posts").select("*").eq("id", id).maybeSingle(),
    sb.from("cats").select("id, name").order("name"),
  ]);
  if (!data) notFound();
  const post = data as Post;
  const cover = publicImage(post.cover_path);
  const live = post.status === "publicado" && post.published_at && post.published_at <= new Date().toISOString();

  return (
    <>
      <PanelTitle
        title={post.title}
        back={{ href: "/panel/blog", label: "Blog y eventos" }}
        action={live ? <Link href={`/blog/${post.slug}`} target="_blank" className="btn btn-outlined btn-sm"><Icon name="eye" size={18} /> Ver en el sitio</Link> : undefined}
      />
      {nuevo && <p className="mb-6 rounded-2xl bg-success-container px-4 py-3 font-semibold text-on-success-container">Entrada creada. Agrega una foto de portada si quieres.</p>}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel>
          <PostForm
            action={updatePost.bind(null, post.id)}
            post={post}
            cats={(cats as { id: string; name: string }[]) ?? []}
            local={{ published: isoToTijuanaLocal(post.published_at), starts: isoToTijuanaLocal(post.event_starts_at), ends: isoToTijuanaLocal(post.event_ends_at) }}
          />
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title="Portada">
            {cover ? (
              <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-2xl bg-surface-high">
                <Image src={cover} alt="" fill sizes="340px" className="object-cover" />
              </div>
            ) : (
              <p className="mb-3 text-sm text-on-surface-variant">Sin portada. Se ve mejor con una foto horizontal.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <PhotoUploader folder={`blog/${post.id}`} multiple={false} label={cover ? "Cambiar portada" : "Subir portada"} onUploaded={setCover.bind(null, post.id)} />
              {cover && <form action={removeCover.bind(null, post.id)}><ConfirmButton className="btn btn-outlined btn-sm" message="¿Quitar la portada?">Quitar</ConfirmButton></form>}
            </div>
          </Panel>
          <form action={deletePost.bind(null, post.id)}>
            <ConfirmButton message="¿Borrar esta entrada?"><Icon name="trash" size={16} /> Borrar entrada</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
