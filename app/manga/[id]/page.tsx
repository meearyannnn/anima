import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMangaById, findMangaChapters, MangaChapter } from "@/lib/api/manga";
import { MangaDetailClient } from "./MangaDetailClient";

interface MangaDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MangaDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await getMangaById(parseInt(id, 10));
    const manga = data.Media;
    const title = manga.title.english || manga.title.romaji || "Manga";
    return {
      title: `${title} | Read Manga on Anima Stream`,
      description: manga.description?.replace(/<[^>]*>?/gm, "").slice(0, 160) || `Read ${title} on Anima Stream`,
      openGraph: {
        images: manga.bannerImage ? [manga.bannerImage] : [manga.coverImage.extraLarge],
      },
    };
  } catch {
    return {
      title: "Manga Not Found | Anima Stream",
    };
  }
}

export default async function MangaDetailPage({ params }: MangaDetailPageProps) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);
  if (isNaN(mangaId)) notFound();

  let mangaData;
  try {
    mangaData = await getMangaById(mangaId);
  } catch (err) {
    console.error("Failed to fetch manga:", err);
    notFound();
  }

  const manga = mangaData.Media;
  const title = manga.title.english || manga.title.romaji;

  // Search Mangapill / MangaDex for real chapter list
  let chapters: MangaChapter[] = [];
  try {
    chapters = await findMangaChapters(title, manga.title.romaji, manga.chapters);
  } catch (err) {
    console.warn("Chapters lookup failed:", err);
  }

  // Look for Anime adaptation in relations
  const animeRelation = manga.relations?.edges?.find(
    (edge) =>
      (edge.relationType === "ADAPTATION" || edge.relationType === "ALTERNATIVE") &&
      (edge.node.format === "TV" || edge.node.format === "MOVIE" || edge.node.format === "OVA" || (edge.node.episodes && edge.node.episodes > 0))
  );

  return (
    <MangaDetailClient
      manga={manga}
      chapters={chapters}
      mangaDexId={null}
      animeAdaptation={animeRelation?.node || null}
    />
  );
}
