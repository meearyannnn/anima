const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export interface TmdbSearchResult {
  id: number;
  name?: string;
  title?: string;
  original_name?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  first_air_date?: string;
  release_date?: string;
  isMovie?: boolean;
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  episode_count: number;
  air_date: string | null;
}

export interface TmdbTvDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: TmdbSeason[];
}

/**
 * Searches TMDB for TV or Movie matching title and optional year.
 */
export async function searchTmdb(
  title: string,
  isMovie = false,
  year?: number
): Promise<TmdbSearchResult | null> {
  const cleanTitle = title
    .replace(/\(TV\)/gi, "")
    .replace(/Season \d+/gi, "")
    .replace(/Part \d+/gi, "")
    .trim();

  // 1. Try search with specified media type
  const endpoint = isMovie ? "search/movie" : "search/tv";
  const yearParam = year ? (isMovie ? `&year=${year}` : `&first_air_date_year=${year}`) : "";

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        cleanTitle
      )}${yearParam}`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return { ...data.results[0], isMovie };
      }
    }

    // 2. If no year match or 0 results, try search without year
    if (yearParam) {
      const fallbackRes = await fetch(
        `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`,
        { next: { revalidate: 86400 } }
      );
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
          return { ...fallbackData.results[0], isMovie };
        }
      }
    }

    // 3. Try multi search as ultimate fallback
    const multiRes = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`,
      { next: { revalidate: 86400 } }
    );
    if (multiRes.ok) {
      const multiData = await multiRes.json();
      const match = multiData.results?.find(
        (r: any) => r.media_type === "tv" || r.media_type === "movie"
      );
      if (match) {
        return { ...match, isMovie: match.media_type === "movie" };
      }
    }
  } catch (err) {
    console.error("TMDB search error:", err);
  }

  return null;
}

/**
 * Fetch TV show details including season list.
 */
export async function getTmdbTvDetails(tmdbId: number): Promise<TmdbTvDetails | null> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch episodes for a given TV season.
 */
export async function getTmdbSeasonEpisodes(
  tmdbId: number,
  seasonNumber = 1
): Promise<TmdbEpisode[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.episodes || [];
  } catch {
    return [];
  }
}

/**
 * Helper to build embed URL for various providers.
 */
export type EmbedProvider = "vidrock" | "vidlink" | "2embed" | "vidsrc" | "embedsu" | "vidsrcsbs" | "vidsrcto";

export interface StreamIds {
  tmdbId?: string;
  imdbId?: string;
  primaryId: string;
}

/**
 * Resolves TMDB and IMDB IDs for an anime using ani.zip mappings,
 * AniList externalLinks, and TMDB search fallback.
 */
export async function resolveStreamIds(
  anilistId: number,
  title: string,
  externalLinks?: { url: string; site: string }[],
  isMovie = false,
  year?: number
): Promise<StreamIds> {
  let tmdbId: string | undefined;
  let imdbId: string | undefined;

  // 1. Check AniList external links for IMDB (e.g. https://www.imdb.com/title/tt22248376/)
  if (externalLinks && externalLinks.length > 0) {
    const imdbLink = externalLinks.find(
      (link) => link.site?.toLowerCase() === "imdb" || link.url?.includes("imdb.com/title/")
    );
    if (imdbLink) {
      const match = imdbLink.url.match(/tt\d+/);
      if (match) {
        imdbId = match[0];
      }
    }
  }

  // 2. Query community AniZip mapping API (https://api.ani.zip/mappings?anilist_id=...)
  try {
    const aniZipRes = await fetch(`https://api.ani.zip/mappings?anilist_id=${anilistId}`);
    if (aniZipRes.ok) {
      const aniZipData = await aniZipRes.json();
      if (aniZipData.mappings) {
        if (aniZipData.mappings.themoviedb_id) {
          tmdbId = String(aniZipData.mappings.themoviedb_id);
        }
        if (aniZipData.mappings.imdb_id) {
          imdbId = String(aniZipData.mappings.imdb_id);
        }
      }
    }
  } catch (e) {
    console.warn("AniZip mapping query failed:", e);
  }

  // 3. Fallback: Query TMDB API directly with title
  if (!tmdbId) {
    try {
      const searchResult = await searchTmdb(title, isMovie, year);
      if (searchResult) {
        tmdbId = String(searchResult.id);
      }
    } catch (e) {
      console.warn("TMDB direct title search failed:", e);
    }
  }

  return {
    tmdbId,
    imdbId,
    primaryId: tmdbId || imdbId || String(anilistId),
  };
}

export interface PlayerOptions {
  autoplay?: boolean;
  autonext?: boolean;
  theme?: string; // hex without #, e.g. "8b5cf6"
  download?: boolean;
  nextbutton?: boolean;
  episodeselector?: boolean;
  lang?: string; // e.g. "en"
}

export function getEmbedUrl(
  provider: EmbedProvider,
  streamId: string | number,
  season = 1,
  episode = 1,
  isMovie = false,
  options?: PlayerOptions
): string {
  const id = String(streamId);
  switch (provider) {
    case "vidrock": {
      const params = new URLSearchParams();
      if (options?.autoplay !== undefined) params.set("autoplay", String(options.autoplay));
      params.set("autonext", "false"); // Always disable auto-advancing next episode
      params.set("theme", options?.theme || "8b5cf6"); // KuroStream purple theme
      if (options?.download !== undefined) params.set("download", String(options.download));
      if (options?.nextbutton !== undefined) params.set("nextbutton", String(options.nextbutton));
      if (options?.episodeselector !== undefined) params.set("episodeselector", String(options.episodeselector));
      if (options?.lang) params.set("lang", options.lang);

      const qs = params.toString() ? `?${params.toString()}` : "";
      return isMovie
        ? `https://vidrock.net/movie/${id}${qs}`
        : `https://vidrock.net/tv/${id}/${season}/${episode}${qs}`;
    }
    case "vidlink": {
      const qs = options?.autoplay ? "?autoplay=true&primaryColor=8b5cf6" : "?primaryColor=8b5cf6";
      return isMovie
        ? `https://vidlink.pro/movie/${id}${qs}`
        : `https://vidlink.pro/tv/${id}/${season}/${episode}${qs}`;
    }
    case "2embed":
      return isMovie
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
    case "vidsrc":
      return isMovie
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`;
    case "vidsrcsbs":
      return isMovie
        ? `https://vidsrc.sbs/embed/movie/${id}`
        : `https://vidsrc.sbs/embed/tv/${id}/${season}/${episode}`;
    case "vidsrcto":
      return isMovie
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
    case "embedsu":
      return isMovie
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${season}/${episode}`;
    default:
      return `https://vidrock.net/tv/${id}/${season}/${episode}?theme=8b5cf6`;
  }
}

