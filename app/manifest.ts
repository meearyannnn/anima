import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KuroStream — Premium Anime",
    short_name: "KuroStream",
    description:
      "Watch the latest and greatest anime in HD on KuroStream. Subbed, dubbed, watch parties, and smart AI recommendations.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090C",
    theme_color: "#09090C",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Discover Anime",
        url: "/search",
        description: "Browse and discover trending anime",
      },
      {
        name: "KuroSync Party",
        url: "/party",
        description: "Watch anime with friends in real time",
      },
      {
        name: "AI Match",
        url: "/search?mode=ai",
        description: "Personalized AI anime recommendations",
      },
      {
        name: "My Vault",
        url: "/my-list",
        description: "View your saved and watching anime",
      },
    ],
  };
}
