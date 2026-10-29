"use client";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/browser";

/**
 * Sube fotos directo desde el celular: las comprime en el navegador
 * (máx. 1600 px, WebP) y las guarda en el bucket "publico".
 * `onUploaded` registra las rutas en la base de datos.
 */
export function PhotoUploader({
  folder,
  onUploaded,
  multiple = true,
  label = "Agregar fotos",
  bucket = "publico",
  allowVideo = false,
}: {
  folder: string;
  onUploaded: (paths: string[]) => Promise<unknown>;
  multiple?: boolean;
  label?: string;
  bucket?: "publico" | "padrinos";
  allowVideo?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const sb = createClient();
    const paths: string[] = [];
    try {
      for (const [i, file] of Array.from(files).entries()) {
        setStatus(`Subiendo ${i + 1} de ${files.length}…`);
        const isVideo = file.type.startsWith("video/");
        if (isVideo && !allowVideo) continue;
        if (isVideo && file.size > 100 * 1024 * 1024) throw new Error("Video de más de 100 MB");
        const body = isVideo ? file : await imageCompression(file, { maxWidthOrHeight: 1600, maxSizeMB: 0.6, fileType: "image/webp", useWebWorker: true });
        const ext = isVideo ? (file.name.split(".").pop() || "mp4").toLowerCase() : "webp";
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from(bucket).upload(path, body, { contentType: isVideo ? file.type : "image/webp", cacheControl: "31536000" });
        if (error) throw error;
        paths.push(path);
      }
      await onUploaded(paths);
      setStatus(`¡Listo! ${paths.length} ${paths.length === 1 ? "archivo" : "archivos"}.`);
      router.refresh();
    } catch (e) {
      console.error(e);
      setStatus(e instanceof Error && e.message.includes("100 MB") ? "El video pesa más de 100 MB. Recórtalo e intenta de nuevo." : "No se pudo subir. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <input ref={input} type="file" accept={allowVideo ? "image/*,video/mp4,video/quicktime,video/webm" : "image/*"} multiple={multiple} className="sr-only" id={`up-${folder}`} onChange={(e) => handle(e.target.files)} disabled={busy} />
      <label htmlFor={`up-${folder}`} className={`btn btn-tonal cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
        <Icon name="upload" /> {busy ? "Subiendo…" : label}
      </label>
      {status && <p className="text-sm text-on-surface-variant" role="status">{status}</p>}
    </div>
  );
}
