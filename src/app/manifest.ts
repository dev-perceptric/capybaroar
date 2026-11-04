import type { MetadataRoute } from "next";

// For "Add to Home Screen": the app icon from brand/ (public/brand).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Capybaroar",
    short_name: "Capybaroar",
    start_url: "/calendar",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
