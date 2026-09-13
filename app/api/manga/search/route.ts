import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/api/manga";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const perPage = parseInt(req.nextUrl.searchParams.get("perPage") || "24", 10);

  if (!q.trim()) {
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
