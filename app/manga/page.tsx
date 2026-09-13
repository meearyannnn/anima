import type { Metadata } from "next";
import { getTrendingManga, getTopManhwa, getTopManga } from "@/lib/api/manga";
import { MangaHubClient } from "./MangaHubClient";

export const metadata: Metadata = {
  title: "Manga & Manhwa Hub | KuroStream",
  description: "Read the latest and greatest manga, manhwa, and light novels in high-definition on KuroStream.",
};

export default async function MangaHubPage() {
  const [trendingData, manhwaData, topData] = await Promise.all([
    getTrendingManga(1, 16).catch(() => ({ Page: { media: [], pageInfo: {} as any } })),
    getTopManhwa(1, 16).catch(() => ({ Page: { media: [], pageInfo: {} as any } })),
    getTopManga(1, 16).catch(() => ({ Page: { media: [], pageInfo: {} as any } })),
  ]);

  return (
    <MangaHubClient
      trending={trendingData.Page.media}
      manhwa={manhwaData.Page.media}
      topRated={topData.Page.media}
    />
  );
}
