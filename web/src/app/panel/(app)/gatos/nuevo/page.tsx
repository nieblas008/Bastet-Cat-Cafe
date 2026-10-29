import { PanelTitle } from "@/components/panel/PanelBits";
import { createClient } from "@/lib/supabase/server";
import type { CatGroup } from "@/lib/types";
import { createCat } from "../actions";
import { CatForm } from "../CatForm";

export const metadata = { title: "Nuevo gato" };

export default async function NewCat() {
  const sb = await createClient();
  const { data: groups } = await sb.from("cat_groups").select("*").order("name");
  return (
    <>
      <PanelTitle title="Nuevo gato" intro="Llena lo que sepas. Las fotos se agregan en el siguiente paso." back={{ href: "/panel/gatos", label: "Gatos" }} />
      <CatForm action={createCat} groups={(groups as CatGroup[]) ?? []} />
    </>
  );
}
