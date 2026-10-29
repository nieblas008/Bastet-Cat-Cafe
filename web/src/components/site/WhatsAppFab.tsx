import { Icon } from "@/components/ui/Icon";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/format";

export async function WhatsAppFab() {
  const settings = await getSettings();
  const wa = whatsappLink(settings, "¡Hola, Bastet! Les escribo desde su sitio web.");
  if (!wa) return null;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-[20px] bg-[#1f8f4e] text-white shadow-[0_12px_28px_-10px_rgba(0,0,0,.45)] transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95"
      aria-label="Escríbenos por WhatsApp"
    >
      <Icon name="whatsapp" size={28} />
    </a>
  );
}
