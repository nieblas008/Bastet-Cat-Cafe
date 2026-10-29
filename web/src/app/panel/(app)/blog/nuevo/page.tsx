import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { createClient } from "@/lib/supabase/server";
import { createPost } from "../actions";
import { PostForm } from "../PostForm";

export const metadata = { title: "Nueva entrada" };

export default async function NuevaEntrada() {
  const sb = await createClient();
  const { data } = await sb.from("cats").select("id, name").order("name");
  return (
    <>
      <PanelTitle title="Nueva entrada" intro="Guárdala como borrador; la foto de portada se agrega después de crearla." back={{ href: "/panel/blog", label: "Blog y eventos" }} />
      <Panel>
        <PostForm action={createPost} cats={(data as { id: string; name: string }[]) ?? []} local={{ published: "", starts: "", ends: "" }} />
      </Panel>
    </>
  );
}
