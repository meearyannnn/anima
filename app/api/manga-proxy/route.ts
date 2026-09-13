import { NextRequest, NextResponse } from "next/server";

// Allowlist of trusted manga CDN hostnames
const ALLOWED_HOSTS = new Set([
  "cdn.readdetectiveconan.com",
  "mangapill.com",
  "uploads.mangadex.network",
  "cmdxd98sb0x3yprd.mangadex.network",
]);

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(decodeURIComponent(url));
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // Only allow http/https protocols
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new NextResponse("Invalid URL protocol", { status: 400 });
  }

  // Reject URLs with embedded credentials (e.g. http://user:pass@host)
  if (parsed.username || parsed.password) {
    return new NextResponse("Invalid URL credentials", { status: 400 });
  }

  // Validate hostname against allowlist with strict boundary matching
  const hostname = parsed.hostname.toLowerCase();
  const isAllowed =
    ALLOWED_HOSTS.has(hostname) ||
    hostname === "mangadex.network" ||
    hostname.endsWith(".mangadex.network") ||
    hostname === "readdetectiveconan.com" ||
    hostname.endsWith(".readdetectiveconan.com");

  // Disallow localhost / private IP addresses
  if (
    !isAllowed ||
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname === "0.0.0.0"
  ) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  // Determine appropriate referer
  let referer = "https://mangapill.com/";
  if (hostname.endsWith(".mangadex.network")) {
    referer = "https://mangadex.org/";
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: referer,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return new NextResponse(`Upstream returned ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";

    // Only proxy image content types
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Non-image content not allowed", { status: 403 });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proxy error";
    console.error("[manga-proxy] Error:", message);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
