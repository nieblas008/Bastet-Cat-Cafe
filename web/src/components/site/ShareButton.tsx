"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function ShareButton({ title, text, className = "btn btn-outlined" }: { title: string; text?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* cancelado */
      }
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <button type="button" className={className} onClick={share}>
      <Icon name="share" size={18} /> {copied ? "¡Enlace copiado!" : "Compartir"}
    </button>
  );
}
