import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/api/manga";

export async function GET(req: NextRequest) {
  const rawQ = req.nextUrl.searchParams.get("q") || "";
  // Sanitize query string: remove control chars and trim to max 100 chars
  const q = rawQ.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 100).trim();

  const parsedPage = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const parsedPerPage = parseInt(req.nextUrl.searchParams.get("perPage") || "24", 10);

  const page = isNaN(parsedPage) ? 1 : Math.max(1, Math.min(50, parsedPage));
  const perPage = isNaN(parsedPerPage) ? 24 : Math.max(1, Math.min(50, parsedPerPage));

  if (!q) {
    return NextResponse.json({ media: [], pageInfo: null });
  }

  try {
    const data = await searchManga({
      query: q.trim(),
      page,
      perPage,
    });

    return NextResponse.json({
      media: data?.Page?.media || [],
      pageInfo: data?.Page?.pageInfo || null,
    }, {
      headers: {
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search error";
    return NextResponse.json({ media: [], error: message }, { status: 500 });
  }
}
