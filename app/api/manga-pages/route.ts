import { NextRequest, NextResponse } from "next/server";
import { getChapterPageUrls } from "@/lib/api/manga";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cleanParam = (val: string | null, maxLen: number) =>
    val ? val.replace(/[\x00-\x1F\x7F]/g, "").slice(0, maxLen).trim() || undefined : undefined;

  const chapterId = cleanParam(searchParams.get("chId"), 120);
  const title = cleanParam(searchParams.get("title"), 200);
  const romajiTitle = cleanParam(searchParams.get("romajiTitle"), 200);
  const chapterNum = cleanParam(searchParams.get("chapter"), 30);

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
