import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMangaById, searchMangaDexId, getMangaDexChapters, MangaChapter } from "@/lib/api/manga";
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
      title: `${title} | Read Manga on KuroStream`,
      description: manga.description?.replace(/<[^>]*>?/gm, "").slice(0, 160) || `Read ${title} on KuroStream`,
      openGraph: {
        images: manga.bannerImage ? [manga.bannerImage] : [manga.coverImage.extraLarge],
      },
    };
  } catch {
    return {
      title: "Manga Not Found | KuroStream",
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

  // Search MangaDex for real chapter list
  let chapters: MangaChapter[] = [];
  let mangaDexId: string | null = null;

  try {
    mangaDexId = await searchMangaDexId(title);
    if (!mangaDexId && manga.title.romaji && manga.title.romaji !== title) {
      mangaDexId = await searchMangaDexId(manga.title.romaji);
    }
    if (mangaDexId) {
      chapters = await getMangaDexChapters(mangaDexId);
    }
  } catch (err) {
    console.warn("MangaDex lookup failed:", err);
  }

  // If no MangaDex chapters found, synthesize chapters based on AniList count or standard 24 chapters
  if (chapters.length === 0) {
    const totalCount = manga.chapters || 24;
    const countToGenerate = Math.min(totalCount, 50); // initial batch
    chapters = Array.from({ length: countToGenerate }, (_, i) => ({
      id: `synthetic-${i + 1}`,
      chapter: `${i + 1}`,
      title: `Chapter ${i + 1}`,
      volume: null,
      pages: 20,
      publishAt: new Date().toISOString(),
    }));
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
      mangaDexId={mangaDexId}
      animeAdaptation={animeRelation?.node || null}
    />
  );
}
