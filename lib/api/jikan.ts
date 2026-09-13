const JIKAN_BASE = "https://api.jikan.moe/v4";

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  score: number | null;
  episodes: number | null;
  status: string;
  genres: { name: string }[];
  year: number | null;
}

export async function getAnimeByMalId(malId: number): Promise<JikanAnime | null> {
  try {
    const res = await fetch(`${JIKAN_BASE}/anime/${malId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as JikanAnime;
  } catch {
    return null;
  }
}

export async function searchJikanAnime(query: string): Promise<JikanAnime[]> {
  try {
    const res = await fetch(
      `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as JikanAnime[]) ?? [];
  } catch {
    return [];
  }
}
