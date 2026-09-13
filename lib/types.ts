// ─── AniList Types ────────────────────────────────────────────────────────────

export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: {
    romaji: string;
    english: string | null;
    native: string;
  };
  description: string | null;
  coverImage: {
    extraLarge: string;
    large: string;
    color: string | null;
  };
  bannerImage: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  episodes: number | null;
  chapters?: number | null;
  volumes?: number | null;
  countryOfOrigin?: string | null;
  duration: number | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  format: string | null;
  studios: {
    nodes: { name: string }[];
  };
  nextAiringEpisode?: {
    episode: number;
    timeUntilAiring: number;
  } | null;
  trailer: {
    id: string;
    site: string;
  } | null;
  rankings: {
    rank: number;
    type: string;
    context: string;
  }[];
  relations?: {
    edges: {
      relationType: string;
      node: AniListMedia;
    }[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation: AniListMedia;
    }[];
  };
  externalLinks?: {
    id: number;
    url: string;
    site: string;
    type?: string;
  }[];
}

export interface AniListPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}

export interface AniListResponse<T> {
  data: T;
}

// ─── AllAnime Types ───────────────────────────────────────────────────────────

export interface AllAnimeEpisode {
  episodeIdNum: number;
  notes: string;
  thumbnails: string[];
}

export interface AllAnimeSource {
  sourceName: string;
  sourceUrl: string;
  priority: number;
  sandbox: string;
  type: string;
  className: string;
  streamerId: string;
}

export interface AllAnimeShow {
  _id: string;
  name: string;
  englishName: string | null;
  episodeCount: number | null;
  lastEpisodeTimestamp: Record<string, string>;
}

// ─── App Types ────────────────────────────────────────────────────────────────

export interface WatchHistoryItem {
  animeId: number;
  animeTitile: string;
  coverImage: string;
  episode: number;
  season?: number;
  progress: number; // 0-1
  totalDuration: number;
  currentTime?: number; // exact seconds elapsed
  duration?: number; // exact total duration in seconds
  watchedAt: number; // timestamp
}

export interface PlaybackTimestamp {
  currentTime: number;
  duration: number;
  formatted: string;
  progress: number;
}

export type WatchlistCategory = "watching" | "planning" | "completed";

export interface MyListItem {
  id: number;
  title: string;
  coverImage: string;
  genres: string[];
  averageScore: number | null;
  episodes: number | null;
  status: string;
  category?: WatchlistCategory;
  addedAt: number;
}

export interface SkipTime {
  interval: {
    startTime: number;
    endTime: number;
  };
  skipType: "op" | "ed" | "recap" | "mixed-ed" | "mixed-op";
  skipId: string;
  episodeLength: number;
}

export interface VideoSource {
  url: string;
  quality: string;
  isM3U8: boolean;
  server: string;
}
