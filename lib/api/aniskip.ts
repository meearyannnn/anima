import type { SkipTime } from "@/lib/types";

const ANISKIP_BASE = "https://api.aniskip.com/v2";

export async function getSkipTimes(
  malId: number,
  episode: number,
  episodeLength?: number
): Promise<SkipTime[]> {
  try {
    const params = new URLSearchParams({
      types: ["op", "ed", "recap", "mixed-ed", "mixed-op"].join(","),
    });
    if (episodeLength) {
      params.set("episodeLength", String(episodeLength));
    }

    const url = `${ANISKIP_BASE}/skip-times/${malId}/${episode}?${params}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // 24h cache
    if (!res.ok) return [];

    const json = await res.json();
    return (json.results as SkipTime[]) ?? [];
  } catch {
    return [];
  }
}
