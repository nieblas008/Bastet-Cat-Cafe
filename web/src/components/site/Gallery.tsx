"use client";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function Gallery({ photos, name }: { photos: { src: string; alt: string }[]; name: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) {
    return (
      <div className="blob-a grid aspect-square place-items-center bg-[radial-gradient(120%_90%_at_20%_10%,#FFD9E2_0%,#F5E4E7_45%,#FFDCBD_100%)] text-primary/50">
        <Icon name="paw" size={120} />
      </div>
    );
  }
  const current = photos[i] ?? photos[0];
  return (
    <div>
      <div className="blob-a relative aspect-square overflow-hidden bg-surface-highest">
        <Image src={current.src} alt={current.alt || `Foto de ${name}`} fill priority sizes="(min-width: 1024px) 520px, 92vw" className="object-cover" />
      </div>
      {photos.length > 1 && (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {photos.map((p, idx) => (
            <li key={p.src}>
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Ver foto ${idx + 1} de ${photos.length}`}
                aria-current={idx === i}
                className={`relative block size-16 overflow-hidden rounded-[18px] ring-offset-2 transition md:size-20 ${idx === i ? "ring-3 ring-primary" : "opacity-80 hover:opacity-100"}`}
              >
                <Image src={p.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
