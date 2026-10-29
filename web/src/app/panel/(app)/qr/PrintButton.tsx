"use client";
import { Icon } from "@/components/ui/Icon";

export function PrintButton() {
  return (
    <button type="button" className="btn btn-sm" onClick={() => window.print()}>
      <Icon name="qr" size={18} /> Imprimir
    </button>
  );
}
