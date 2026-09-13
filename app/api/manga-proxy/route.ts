import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(url);

    // Validate that it is an http/https URL
    const parsed = new URL(decodedUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new NextResponse("Invalid URL protocol", { status: 400 });
    }

    // Determine appropriate referer based on host
    let referer = "https://mangapill.com/";
    if (parsed.hostname.includes("mangadex")) {
      referer = "https://mangadex.org/";
    } else if (parsed.hostname.includes("readdetectiveconan") || parsed.hostname.includes("mangapill")) {
      referer = "https://mangapill.com/";
    }

    const res = await fetch(decodedUrl, {
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
    const errorMessage = err instanceof Error ? err.message : "Proxy error";
    return new NextResponse(`Proxy error: ${errorMessage}`, { status: 500 });
  }
}
