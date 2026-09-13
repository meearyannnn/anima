import type { AniListMedia, AniListPageInfo } from "@/lib/types";

const ANILIST_URL = "https://graphql.anilist.co";

// ─── Media Fragment ───────────────────────────────────────────────────────────

const MEDIA_FRAGMENT = `
  fragment MediaFields on Media {
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
    episodes
    chapters
    volumes
    duration
    status
    season
    seasonYear
    startDate { year month day }
    format
    studios(isMain: true) {
      nodes { name }
    }
    trailer { id site }
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

// ─── Trending ─────────────────────────────────────────────────────────────────

export async function getTrending(page = 1, perPage = 20): Promise<{
  Page: { media: AniListMedia[]; pageInfo: AniListPageInfo };
}> {
  return gql(
    `
    ${MEDIA_FRAGMENT}
    query GetTrending($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ...MediaFields
        }
      }
    }
  `,
    { page, perPage }
  );
}

// ─── Seasonal ─────────────────────────────────────────────────────────────────

export async function getSeasonalAnime(
  season: string,
  year: number,
  page = 1,
  perPage = 24
): Promise<{ Page: { media: AniListMedia[]; pageInfo: AniListPageInfo } }> {
  return gql(
    `
    ${MEDIA_FRAGMENT}
    query GetSeasonal($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(season: $season, seasonYear: $year, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ...MediaFields
        }
      }
    }
  `,
    { season, year, page, perPage }
  );
}

// ─── Anime by ID ──────────────────────────────────────────────────────────────

export async function getAnimeById(id: number): Promise<{ Media: AniListMedia }> {
  return gql(`
    ${MEDIA_FRAGMENT}
    query GetAnime($id: Int) {
      Media(id: $id, type: ANIME) {
        ...MediaFields
        relations {
          edges {
            relationType
            node { ...MediaFields }
          }
        }
        recommendations(perPage: 10, sort: RATING_DESC) {
          nodes {
            mediaRecommendation { ...MediaFields }
          }
        }
      }
    }
  `, { id });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string;
  genres?: string[];
  year?: number;
  format?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export async function searchAnime(filters: SearchFilters): Promise<{
  Page: { media: AniListMedia[]; pageInfo: AniListPageInfo };
}> {
  const { query, genres, year, format, status, page = 1, perPage = 20 } = filters;
  return gql(
    `
    ${MEDIA_FRAGMENT}
    query SearchAnime($query: String, $genres: [String], $year: Int, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(search: $query, genre_in: $genres, seasonYear: $year, format: $format, status: $status, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
          ...MediaFields
        }
      }
    }
  `,
    {
      query: query || undefined,
      genres: genres?.length ? genres : undefined,
      year: year || undefined,
      format: format || undefined,
      status: status || undefined,
      page,
      perPage,
    }
  );
}

// ─── Top Anime ────────────────────────────────────────────────────────────────

export async function getTopAnime(perPage = 10): Promise<{
  Page: { media: AniListMedia[] };
}> {
  return gql(
    `
    ${MEDIA_FRAGMENT}
    query GetTop($perPage: Int) {
      Page(perPage: $perPage) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          ...MediaFields
        }
      }
    }
  `,
    { perPage }
  );
}

// ─── Current Season Helper ────────────────────────────────────────────────────

export function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let season: string;

  if (month >= 1 && month <= 3) season = "WINTER";
  else if (month >= 4 && month <= 6) season = "SPRING";
  else if (month >= 7 && month <= 9) season = "SUMMER";
  else season = "FALL";

  return { season, year };
}
