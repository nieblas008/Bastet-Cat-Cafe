import Link from "next/link";
import { Brand } from "@/components/site/Brand";

export const metadata = { title: { default: "Portal de padrinos", template: "%s · Padrinos de Bastet" }, robots: { index: false } };

export default function PadrinoLayout({ children }: LayoutProps<"/padrino">) {
  return (
    <div className="min-h-svh bg-surface-low">
      <header className="container-site flex items-center justify-between py-4">
        <Brand />
        <Link href="/apadrina" className="btn btn-text btn-sm">Volver al sitio</Link>
      </header>
      <main className="container-site pb-16">{children}</main>
    </div>
  );
}
