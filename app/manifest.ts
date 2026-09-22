import type { MetadataRoute } from "next";

// Lets a visitor add the site to their phone's home screen, where it opens like an app without the browser bars.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aarifa Flowers",
    short_name: "Aarifa Flowers",
    description: "Fresh handmade garlands for weddings, pooja, events and special occasions. Order on WhatsApp.",
    // The home address chooses the visitor's language, so the installed app opens in the language they use.
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f2",
    theme_color: "#fff9f2",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
