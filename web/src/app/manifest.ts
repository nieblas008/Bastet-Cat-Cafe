import type { MetadataRoute } from "next";

// Permite "Agregar a inicio" en el celular: el panel abre como app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bastet Cat Café",
    short_name: "Bastet",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F8",
    theme_color: "#B90062",
    icons: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  };
}
