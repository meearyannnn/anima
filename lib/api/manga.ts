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

// ─── MangaDex API Chapter & Reader Integration ──────────────────────────────

export interface MangaChapter {
  id: string;
  chapter: string;
  title: string;
  volume: string | null;
  pages: number;
  publishAt: string;
  scanlationGroup?: string;
}

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

      // Avoid duplicates: keep first or preferred version
      if (!chaptersMap.has(chapterNum)) {
        chaptersMap.set(chapterNum, {
          id: ch.id,
          chapter: chapterNum,
          title: ch.attributes.title || `Chapter ${chapterNum}`,
          volume: ch.attributes.volume || null,
          pages: ch.attributes.pages || 0,
          publishAt: ch.attributes.publishAt,
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
    const hash = data.chapter.hash;
    const files = data.chapter.data as string[];

    return files.map((file) => `${baseUrl}/data/${hash}/${file}`);
  } catch {
    return [];
  }
}
