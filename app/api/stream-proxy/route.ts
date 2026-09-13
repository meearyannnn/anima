import { NextRequest, NextResponse } from "next/server";

// Allowed upstream domains for the HLS stream proxy
const ALLOWED_STREAM_HOSTS = [
  "vidsrc.stream",
  "vidsrc.rip",
  "vidplay.online",
  "vidstream.pro",
  "test-streams.mux.dev",
  "playertest.longtailvideo.com",
  "bitdash-a.akamaihd.net",
  "d2zihajmogu5jn.cloudfront.net",
  "stream.mux.com",
];

/**
 * Server-side HLS stream proxy
 * Fetches .m3u8 manifest or .ts segment from upstream CDN and forwards it
 * to the browser with proper CORS headers, bypassing browser CORS restrictions.
 *
 * Usage: GET /api/stream-proxy?url=<encoded_stream_url>
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Security: only allow http/https protocols
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Protocol not allowed" }, { status: 403 });
  }

  // Security: allowlist check — only proxy from known safe stream CDNs
  const hostname = parsedUrl.hostname.toLowerCase();
  const isAllowed = ALLOWED_STREAM_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );
  if (!isAllowed) {
    return NextResponse.json({ error: "Host not in allowlist" }, { status: 403 });
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AnimaStream/1.0)",
        Referer: "https://animastream.vercel.app/",
        Origin: "https://animastream.vercel.app",
        Accept: "*/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const body = await upstream.arrayBuffer();

    // If it's an m3u8 manifest, rewrite segment URLs to go through this proxy
    if (
      contentType.includes("mpegurl") ||
      contentType.includes("m3u8") ||
      rawUrl.includes(".m3u8")
    ) {
      const text = new TextDecoder().decode(body);
      const baseUrl = rawUrl.substring(0, rawUrl.lastIndexOf("/") + 1);

      const rewritten = text
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("#") || trimmed === "") return line;
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return `/api/stream-proxy?url=${encodeURIComponent(trimmed)}`;
          }
          try {
            const absolute = new URL(trimmed, baseUrl).toString();
            return `/api/stream-proxy?url=${encodeURIComponent(absolute)}`;
          } catch {
            return line;
          }
        })
        .join("\n");

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // For .ts segments and other binary content, forward directly
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
