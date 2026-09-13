import { NextRequest, NextResponse } from "next/server";

export interface DirectStreamSource {
  url: string;
  quality: string;
  isM3U8: boolean;
  server: string;
}

export interface DirectStreamResponse {
  sources: DirectStreamSource[];
  subtitles?: { url: string; lang: string }[];
  provider: string;
}

/**
 * Direct Stream Resolver API Route
 * Resolves a proxied HLS (.m3u8) stream URL for native video playback.
 * All stream URLs are routed through /api/stream-proxy to bypass CORS.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const animeId = searchParams.get("animeId");
  const title = searchParams.get("title") || "";
  const episode = parseInt(searchParams.get("episode") || "1", 10);
  const season = parseInt(searchParams.get("season") || "1", 10);

  if (!animeId) {
    return NextResponse.json({ directUrl: null, sources: [], error: "Missing animeId" }, { status: 400 });
  }

  const sources: DirectStreamSource[] = [];

  try {
    // 1. Lookup AniZip ID mappings (server-to-server, no CORS issues)
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 4000);

    const aniZipData = await fetch(`https://api.ani.zip/mappings?anilist_id=${animeId}`, {
      signal: timeoutController.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .finally(() => clearTimeout(timeoutId));

    if (aniZipData?.mappings?.allanime_id) {
      // Wrap the direct m3u8 URL through our server-side proxy to eliminate CORS
      const rawStreamUrl = `https://vidsrc.stream/anime/${aniZipData.mappings.allanime_id}/${episode}.m3u8`;
      const proxiedUrl = `/api/stream-proxy?url=${encodeURIComponent(rawStreamUrl)}`;
      sources.push({
        url: proxiedUrl,
        quality: "Auto (Multi)",
        isM3U8: true,
        server: "Primary Direct",
      });
    }

    // 2. Mux test stream as a reliable demo / fallback for verifying the native player
    const muxDemoProxied = `/api/stream-proxy?url=${encodeURIComponent("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8")}`;

    const directUrl = sources[0]?.url || null;

    return NextResponse.json(
      {
        directUrl,
        demoUrl: muxDemoProxied,
        sources,
        provider: directUrl ? "native-hls" : "embed-fallback",
        animeId,
        episode,
        season,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { directUrl: null, demoUrl: null, sources: [], provider: "embed-fallback" },
      { status: 200 }
    );
  }
}

