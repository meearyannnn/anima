import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getMangaById,
  findMangaChapters,
  getChapterPageUrls,
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
    chapters = await findMangaChapters(title, manga.title.romaji, manga.chapters);

    // If chId not supplied or is synthetic, find matching chapter in chapters
    if (!chId || chId.startsWith("synthetic")) {
      const targetNum = parseFloat(chapter);
      const found = chapters.find((c) => {
        const num = parseFloat(c.chapter);
        return !isNaN(num) && num === targetNum;
      });
      if (found) {
        chId = found.id;
      }
    }
  } catch (err) {
    console.warn("Chapters resolution error:", err);
  }

  // Fetch in-app proxied pages
  try {
    pages = await getChapterPageUrls({
      chapterId: chId,
      title,
      romajiTitle: manga.title.romaji,
      chapterNum: chapter,
    });
  } catch (err) {
    console.warn("Failed to fetch chapter pages:", err);
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
