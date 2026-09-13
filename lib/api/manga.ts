import type { AniListMedia, AniListPageInfo } from "@/lib/types";

const ANILIST_URL = "https://graphql.anilist.co";
const MANGADEX_URL = "https://api.mangadex.org";

const MANGA_MEDIA_FRAGMENT = `
  fragment MangaMediaFields on Media {
    id
    idMal
    title {
      romaji
      english
      native
    }
    description(asHtml: false)
    coverImage {
      extraLarge
      large
      color
    }
    bannerImage
    genres
    averageScore
    popularity
    chapters
    volumes
    status
    format
    countryOfOrigin
    startDate { year month day }
    rankings { rank type context }
    externalLinks { id url site type }
  }
`;

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 }, // 5 min cache
  });

  if (!res.ok) {
    throw new Error(`AniList API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || "AniList GraphQL error");
  }
  return json.data as T;
}

// ─── AniList Manga Queries ──────────────────────────────────────────────────

export async function getTrendingManga(page = 1, perPage = 20): Promise<{
  Page: { media: AniListMedia[]; pageInfo: AniListPageInfo };
}> {
  return gql(
    `
    ${MANGA_MEDIA_FRAGMENT}
    query GetTrendingManga($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(sort: TRENDING_DESC, type: MANGA, isAdult: false) {
          ...MangaMediaFields
        }
      }
    }
  `,
    { page, perPage }
  );
}

export async function getTopManhwa(page = 1, perPage = 20): Promise<{
  Page: { media: AniListMedia[]; pageInfo: AniListPageInfo };
}> {
  return gql(
    `
    ${MANGA_MEDIA_FRAGMENT}
    query GetTopManhwa($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(countryOfOrigin: "KR", sort: POPULARITY_DESC, type: MANGA, isAdult: false) {
          ...MangaMediaFields
        }
      }
    }
  `,
    { page, perPage }
  );
}

export async function getTopManga(page = 1, perPage = 20): Promise<{
  Page: { media: AniListMedia[]; pageInfo: AniListPageInfo };
}> {
  return gql(
    `
    ${MANGA_MEDIA_FRAGMENT}
    query GetTopManga($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(sort: SCORE_DESC, type: MANGA, isAdult: false) {
          ...MangaMediaFields
        }
      }
    }
  `,
    { page, perPage }
  );
}

export async function getMangaById(id: number): Promise<{ Media: AniListMedia }> {
  return gql(
    `
    ${MANGA_MEDIA_FRAGMENT}
    query GetManga($id: Int) {
      Media(id: $id, type: MANGA) {
        ...MangaMediaFields
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { romaji english native }
              coverImage { large }
              bannerImage
              format
              episodes
              chapters
              volumes
              averageScore
              status
            }
          }
        }
        recommendations(perPage: 10, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              ...MangaMediaFields
            }
          }
        }
      }
    }
  `,
    { id }
  );
}

export async function searchManga(filters: {
  query?: string;
  genres?: string[];
  format?: string;
  page?: number;
  perPage?: number;
}): Promise<{ Page: { media: AniListMedia[]; pageInfo: AniListPageInfo } }> {
  const { query, genres, format, page = 1, perPage = 20 } = filters;
  return gql(
    `
    ${MANGA_MEDIA_FRAGMENT}
    query SearchManga($query: String, $genres: [String], $format: MediaFormat, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(search: $query, genre_in: $genres, format: $format, type: MANGA, isAdult: false, sort: POPULARITY_DESC) {
          ...MangaMediaFields
        }
      }
    }
  `,
    {
      query: query || undefined,
      genres: genres?.length ? genres : undefined,
      format: format || undefined,
      page,
      perPage,
    }
  );
}

// ─── Manga Scraping & Chapter Integration (Mangapill + MangaDex) ──────────────

export interface MangaChapter {
  id: string;
  chapter: string;
  title: string;
  volume: string | null;
  pages: number;
  publishAt: string;
  scanlationGroup?: string;
  source?: "mangapill" | "mangadex" | "synthetic";
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function getProxiedMangaImageUrl(originalUrl: string): string {
  if (!originalUrl) return "";
  if (originalUrl.startsWith("/api/manga-proxy")) return originalUrl;
  return `/api/manga-proxy?url=${encodeURIComponent(originalUrl)}`;
}

// ── Mangapill Scraper ────────────────────────────────────────────────────────

export async function searchMangapill(query: string): Promise<string | null> {
  try {
    const cleanTitle = query
      .replace(/\(TV\)/gi, "")
      .replace(/Season \d+/gi, "")
      .replace(/!/g, "")
      .trim();

    const res = await fetch(`https://mangapill.com/search?q=${encodeURIComponent(cleanTitle)}`, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const matches = [...html.matchAll(/href="(\/manga\/\d+\/[^"]+)"/g)];
    if (matches.length === 0) return null;

    // Return the first matching manga path
    return matches[0][1];
  } catch (err) {
    console.warn("Mangapill search error:", err);
    return null;
  }
}

export async function getMangapillChapters(mangaPath: string): Promise<MangaChapter[]> {
  try {
    const res = await fetch(`https://mangapill.com${mangaPath}`, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const chMatches = [...html.matchAll(/href="(\/chapters\/\d+-\d+\/[^"]+)"[^>]*>([^<]+)<\/a>/g)];
    if (chMatches.length === 0) return [];

    const chaptersMap = new Map<string, MangaChapter>();

    for (const match of chMatches) {
      const link = match[1];
      const rawName = match[2].trim();

      // Extract chapter number from title or URL (e.g. "Chapter 3" -> "3", "chapter-3" -> "3")
      const numMatch = rawName.match(/chapter\s*([\d.]+)/i) || link.match(/chapter-([\d.]+)/i);
      const chapterNum = numMatch ? numMatch[1] : "";
      if (!chapterNum) continue;

      if (!chaptersMap.has(chapterNum)) {
        chaptersMap.set(chapterNum, {
          id: link,
          chapter: chapterNum,
          title: rawName,
          volume: null,
          pages: 0,
          publishAt: new Date().toISOString(),
          source: "mangapill",
        });
      }
    }

    // Sort ascending by chapter number (1, 2, 3...)
    return Array.from(chaptersMap.values()).sort(
      (a, b) => parseFloat(a.chapter) - parseFloat(b.chapter)
    );
  } catch (err) {
    console.warn("Mangapill chapters fetch error:", err);
    return [];
  }
}

export async function getMangapillChapterPages(chapterPath: string): Promise<string[]> {
  try {
    const res = await fetch(`https://mangapill.com${chapterPath}`, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const imgMatches = [...html.matchAll(/data-src="([^"]+)"/g)];
    if (imgMatches.length > 0) {
      return imgMatches.map((m) => m[1]);
    }

    // Fallback if data-src not used
    const srcMatches = [...html.matchAll(/src="([^"]+)"/g)];
    return srcMatches
      .map((m) => m[1])
      .filter((url) => url.includes("chapter") || url.includes("page") || url.includes(".readdetectiveconan.com"));
  } catch (err) {
    console.warn("Mangapill chapter pages error:", err);
    return [];
  }
}

// ── MangaDex Fallback ────────────────────────────────────────────────────────

export async function searchMangaDexId(title: string): Promise<string | null> {
  try {
    const cleanTitle = title
      .replace(/\(TV\)/gi, "")
      .replace(/Season \d+/gi, "")
      .trim();

    const res = await fetch(
      `${MANGADEX_URL}/manga?title=${encodeURIComponent(cleanTitle)}&limit=1&availableTranslatedLanguage[]=en`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.id || null;
  } catch {
    return null;
  }
}

export async function getMangaDexChapters(mangaDexId: string): Promise<MangaChapter[]> {
  try {
    const res = await fetch(
      `${MANGADEX_URL}/manga/${mangaDexId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=100`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const chaptersMap = new Map<string, MangaChapter>();

    for (const ch of data.data || []) {
      const chapterNum = ch.attributes.chapter;
      if (!chapterNum) continue;

      if (!chaptersMap.has(chapterNum)) {
        chaptersMap.set(chapterNum, {
          id: ch.id,
          chapter: chapterNum,
          title: ch.attributes.title || `Chapter ${chapterNum}`,
          volume: ch.attributes.volume || null,
          pages: ch.attributes.pages || 0,
          publishAt: ch.attributes.publishAt,
          source: "mangadex",
        });
      }
    }

    return Array.from(chaptersMap.values()).sort(
      (a, b) => parseFloat(a.chapter) - parseFloat(b.chapter)
    );
  } catch {
    return [];
  }
}

export async function getMangaChapterPages(chapterId: string): Promise<string[]> {
  try {
    const res = await fetch(`${MANGADEX_URL}/at-home/server/${chapterId}`);
    if (!res.ok) return [];
    const data = await res.json();
    const baseUrl = data.baseUrl;
    const hash = data.chapter?.hash;
    const files = (data.chapter?.data as string[]) || [];

    if (!baseUrl || !hash || files.length === 0) return [];
    return files.map((file) => `${baseUrl}/data/${hash}/${file}`);
  } catch {
    return [];
  }
}

// ── Unified Aggregators ──────────────────────────────────────────────────────

export async function findMangaChapters(
  title: string,
  romajiTitle?: string,
  totalChaptersEstimate?: number | null
): Promise<MangaChapter[]> {
  // 1. Try Mangapill
  try {
    let mangapillPath = await searchMangapill(title);
    if (!mangapillPath && romajiTitle && romajiTitle !== title) {
      mangapillPath = await searchMangapill(romajiTitle);
    }

    if (mangapillPath) {
      const pillChapters = await getMangapillChapters(mangapillPath);
      if (pillChapters.length > 0) {
        return pillChapters;
      }
    }
  } catch (err) {
    console.warn("Mangapill aggregator failed:", err);
  }

  // 2. Try MangaDex fallback
  try {
    let dexId = await searchMangaDexId(title);
    if (!dexId && romajiTitle && romajiTitle !== title) {
      dexId = await searchMangaDexId(romajiTitle);
    }
    if (dexId) {
      const dexChapters = await getMangaDexChapters(dexId);
      if (dexChapters.length > 0) {
        return dexChapters;
      }
    }
  } catch (err) {
    console.warn("MangaDex aggregator failed:", err);
  }

  // 3. Fallback: generate synthetic chapters based on AniList count
  const count = Math.min(totalChaptersEstimate || 24, 60);
  return Array.from({ length: count }, (_, i) => ({
    id: `synthetic-${i + 1}`,
    chapter: `${i + 1}`,
    title: `Chapter ${i + 1}`,
    volume: null,
    pages: 20,
    publishAt: new Date().toISOString(),
    source: "synthetic",
  }));
}

export async function getChapterPageUrls(options: {
  chapterId?: string;
  title?: string;
  romajiTitle?: string;
  chapterNum?: string;
}): Promise<string[]> {
  const { chapterId, title, romajiTitle, chapterNum } = options;
  let rawPages: string[] = [];

  // If chapterId is a Mangapill chapter path
  if (chapterId && chapterId.startsWith("/chapters/")) {
    rawPages = await getMangapillChapterPages(chapterId);
  }

  // If chapterId is a MangaDex UUID (36 chars with hyphens)
  if (
    rawPages.length === 0 &&
    chapterId &&
    chapterId.length > 30 &&
    chapterId.includes("-") &&
    !chapterId.startsWith("synthetic")
  ) {
    rawPages = await getMangaChapterPages(chapterId);
  }

  // If still empty (e.g. synthetic chapter ID or direct chapter URL hit), scrape Mangapill directly by title & chapter number
  if (rawPages.length === 0 && title && chapterNum) {
    try {
      let mangapillPath = await searchMangapill(title);
      if (!mangapillPath && romajiTitle && romajiTitle !== title) {
        mangapillPath = await searchMangapill(romajiTitle);
      }

      if (mangapillPath) {
        const chapters = await getMangapillChapters(mangapillPath);
        const targetNum = parseFloat(chapterNum);
        const found = chapters.find((c) => {
          const num = parseFloat(c.chapter);
          return !isNaN(num) && num === targetNum;
        });
        if (found && found.id.startsWith("/chapters/")) {
          rawPages = await getMangapillChapterPages(found.id);
        }
      }
    } catch (err) {
      console.warn("Direct chapter scraper failed:", err);
    }
  }

  // Map all URLs to internal proxy
  return rawPages.map((url) => getProxiedMangaImageUrl(url));
}
