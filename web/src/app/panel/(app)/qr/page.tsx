import Link from "next/link";
import QRCode from "qrcode";
import { PanelTitle } from "@/components/panel/PanelBits";
import { SITE_URL } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "QR del menú" };

const TARGETS = {
  menu: { path: "/menu", title: "Nuestro menú", sub: "Escanea para ver bebidas, comida y precios" },
  gatos: { path: "/gatos", title: "Conoce a los michis", sub: "Escanea para ver quién busca familia" },
  adoptar: { path: "/adoptar", title: "¿Te enamoraste?", sub: "Escanea para saber cómo adoptar" },
  apadrina: { path: "/apadrina", title: "Apadrina a un michi", sub: "Escanea para apoyar sus cuidados cada mes" },
} as const;

export default async function QR({ searchParams }: PageProps<"/panel/qr">) {
  const { a } = await searchParams;
  const key = (typeof a === "string" && a in TARGETS ? a : "menu") as keyof typeof TARGETS;
  const t = TARGETS[key];
  const url = `${SITE_URL}${t.path}?utm_source=qr&utm_medium=mesa`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#2a1720", light: "#ffffff" } });

  return (
    <>
      <div className="print:hidden">
        <PanelTitle title="Códigos QR" intro="Imprime y pon en las mesas. El menú del QR se actualiza solo cuando cambias el menú o marcas algo agotado." action={<PrintButton />} />
        <nav className="mb-6 flex flex-wrap gap-2">
          {Object.entries(TARGETS).map(([k, v]) => (
            <Link key={k} href={`/panel/qr?a=${k}`} className={`chip min-h-10 border ${k === key ? "border-primary bg-primary-container" : "border-outline-variant bg-white"}`}>{v.title}</Link>
          ))}
        </nav>
        {SITE_URL.includes("localhost") && (
          <p className="mb-6 rounded-2xl bg-error-container px-4 py-3 text-on-error-container">Falta configurar la dirección del sitio (NEXT_PUBLIC_SITE_URL). No imprimas este QR todavía.</p>
        )}
      </div>
      <div className="qr-sheet mx-auto grid max-w-[420px] place-items-center gap-4 rounded-[32px] border-2 border-primary bg-white p-8 text-center print:border-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Bastet Cat Café" className="h-16 w-auto" />
        <h2 className="font-display text-3xl font-extrabold text-primary">{t.title}</h2>
        <div className="w-full max-w-[300px]" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="text-lg font-semibold">{t.sub}</p>
        <p className="text-sm text-on-surface-variant">{SITE_URL.replace(/^https?:\/\//, "")}{t.path}</p>
      </div>
    </>
  );
}
