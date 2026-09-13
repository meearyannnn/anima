import { NextRequest, NextResponse } from "next/server";
import { getChapterPageUrls } from "@/lib/api/manga";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const chapterId = searchParams.get("chId") || undefined;
  const title = searchParams.get("title") || undefined;
  const romajiTitle = searchParams.get("romajiTitle") || undefined;
  const chapterNum = searchParams.get("chapter") || undefined;

  try {
    const pages = await getChapterPageUrls({
      chapterId,
      title,
      romajiTitle,
      chapterNum,
    });

    return NextResponse.json({ pages }, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching pages";
    return NextResponse.json({ pages: [], error: message }, { status: 500 });
  }
}
