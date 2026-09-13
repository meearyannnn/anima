import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getMangaById,
  searchMangaDexId,
  getMangaDexChapters,
  getMangaChapterPages,
  MangaChapter,
} from "@/lib/api/manga";
import { MangaReaderClient } from "./MangaReaderClient";

interface MangaReaderPageProps {
  params: Promise<{ id: string; chapter: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: MangaReaderPageProps): Promise<Metadata> {
  const { id, chapter } = await params;
  try {
    const data = await getMangaById(parseInt(id, 10));
    const title = data.Media.title.english || data.Media.title.romaji || "Manga";
    return {
      title: `${title} - Chapter ${chapter} | KuroStream Reader`,
      description: `Read ${title} Chapter ${chapter} online in high definition on KuroStream.`,
    };
  } catch {
    return {
      title: `Read Chapter ${chapter} | KuroStream`,
    };
  }
}

export default async function MangaReaderPage({ params, searchParams }: MangaReaderPageProps) {
  const { id, chapter } = await params;
  const sParams = await searchParams;
  let chId = typeof sParams.chId === "string" ? sParams.chId : undefined;

  const mangaId = parseInt(id, 10);
  if (isNaN(mangaId)) notFound();

  let mangaData;
  try {
    mangaData = await getMangaById(mangaId);
  } catch (err) {
    console.error("Failed to fetch manga for reader:", err);
    notFound();
  }

  const manga = mangaData.Media;
  const title = manga.title.english || manga.title.romaji;

  let chapters: MangaChapter[] = [];
  let pages: string[] = [];

  try {
    let mangaDexId = await searchMangaDexId(title);
    if (!mangaDexId && manga.title.romaji && manga.title.romaji !== title) {
      mangaDexId = await searchMangaDexId(manga.title.romaji);
    }

    if (mangaDexId) {
      chapters = await getMangaDexChapters(mangaDexId);

      // If chId not supplied or is synthetic, find matching chapter in chapters
      if (!chId || chId.startsWith("synthetic")) {
        const found = chapters.find((c) => c.chapter === chapter);
        if (found) {
          chId = found.id;
        }
      }
    }
  } catch (err) {
    console.warn("MangaDex chapters fetch error:", err);
  }

  // If we have a valid MangaDex chapter UUID (non-synthetic), fetch page images
  if (chId && !chId.startsWith("synthetic")) {
    try {
      pages = await getMangaChapterPages(chId);
    } catch (err) {
      console.warn("Failed to fetch chapter pages from MangaDex:", err);
    }
  }

  // If chapters list is empty, synthesize chapter list
  if (chapters.length === 0) {
    const totalCount = manga.chapters || 24;
    chapters = Array.from({ length: Math.min(totalCount, 50) }, (_, i) => ({
      id: `synthetic-${i + 1}`,
      chapter: `${i + 1}`,
      title: `Chapter ${i + 1}`,
      volume: null,
      pages: 20,
      publishAt: new Date().toISOString(),
    }));
  }

  return (
    <MangaReaderClient
      manga={manga}
      currentChapter={chapter}
      currentChapterId={chId}
      chapters={chapters}
      pages={pages}
    />
  );
}
