"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  ArrowUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AniListMedia } from "@/lib/types";
import { MangaChapter } from "@/lib/api/manga";
import { cn } from "@/lib/utils";
import { SaitamaLoader } from "@/components/ui/SaitamaLoader";

interface MangaReaderClientProps {
  manga: AniListMedia;
  currentChapter: string;
  currentChapterId?: string;
  chapters: MangaChapter[];
  pages: string[];
}

export function MangaReaderClient({
  manga,
  currentChapter,
  currentChapterId,
  chapters,
  pages: initialPages,
}: MangaReaderClientProps) {
  const router = useRouter();
  const [pages, setPages] = useState<string[]>(initialPages);
  const [loadingPages, setLoadingPages] = useState<boolean>(initialPages.length === 0);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  const title = manga.title.english || manga.title.romaji;

  // Find previous and next chapters
  const currentIndex = chapters.findIndex(
    (c) => parseFloat(c.chapter) === parseFloat(currentChapter)
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  // Client-side fallback fetch if initialPages is empty
  useEffect(() => {
    setPages(initialPages);
    if (initialPages.length === 0) {
      let isMounted = true;
      setLoadingPages(true);
      setLoadError(false);

      const params = new URLSearchParams();
      if (currentChapterId) params.set("chId", currentChapterId);
      if (title) params.set("title", title);
      if (manga.title.romaji) params.set("romajiTitle", manga.title.romaji);
      params.set("chapter", currentChapter);

      fetch(`/api/manga-pages?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
            setPages(data.pages);
          } else {
            setLoadError(true);
          }
        })
        .catch(() => {
          if (isMounted) setLoadError(true);
        })
        .finally(() => {
          if (isMounted) setLoadingPages(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setLoadingPages(false);
      setLoadError(false);
    }
  }, [initialPages, currentChapter, currentChapterId, title, manga.title.romaji]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(
          100,
          Math.max(0, Math.round((window.scrollY / totalHeight) * 100))
        );
        setReadProgress(progress);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevChapter) {
        router.push(`/manga/${manga.id}/${prevChapter.chapter}?chId=${encodeURIComponent(prevChapter.id)}`);
      } else if (e.key === "ArrowRight" && nextChapter) {
        router.push(`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, manga.id, router]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChapterSelect = (chNum: string) => {
    const selected = chapters.find((c) => c.chapter === chNum);
    if (selected) {
      router.push(`/manga/${manga.id}/${selected.chapter}?chId=${encodeURIComponent(selected.id)}`);
    }
  };

  const handleRetry = () => {
    setLoadingPages(true);
    setLoadError(false);
    const params = new URLSearchParams();
    if (currentChapterId) params.set("chId", currentChapterId);
    if (title) params.set("title", title);
    if (manga.title.romaji) params.set("romajiTitle", manga.title.romaji);
    params.set("chapter", currentChapter);

    fetch(`/api/manga-pages?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
          setPages(data.pages);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoadingPages(false));
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* Top Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-black/85 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/manga/${manga.id}`}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors flex-shrink-0"
            title="Back to Manga Overview"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate">{title}</h1>
            <p className="text-[11px] text-magenta-400 font-semibold">
              Chapter {currentChapter} {pages.length > 0 && `• ${pages.length} Pages`}
            </p>
          </div>
        </div>

        {/* Chapter Picker & Navigation */}
        <div className="flex items-center gap-2">
          {prevChapter ? (
            <Link
              href={`/manga/${manga.id}/${prevChapter.chapter}?chId=${encodeURIComponent(prevChapter.id)}`}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 transition-colors"
              title={`Previous: Ch. ${prevChapter.chapter}`}
            >
              <ChevronLeft size={18} />
            </Link>
          ) : (
            <button disabled className="p-2 rounded-xl bg-white/5 text-white/20 cursor-not-allowed">
              <ChevronLeft size={18} />
            </button>
          )}

          <select
            value={currentChapter}
            onChange={(e) => handleChapterSelect(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-magenta-500/50 cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
          >
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.chapter} className="bg-kuro-card text-white">
                Ch. {ch.chapter} {ch.title !== `Chapter ${ch.chapter}` ? `— ${ch.title}` : ""}
              </option>
            ))}
          </select>

          {nextChapter ? (
            <Link
              href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 transition-colors"
              title={`Next: Ch. ${nextChapter.chapter}`}
            >
              <ChevronRight size={18} />
            </Link>
          ) : (
            <button disabled className="p-2 rounded-xl bg-white/5 text-white/20 cursor-not-allowed">
              <ChevronRight size={18} />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Reading Progress Indicator Bar */}
      <div className="fixed top-[57px] left-0 right-0 h-1 bg-white/5 z-50">
        <div
          className="h-full bg-gradient-to-r from-magenta-500 to-pink-500 shadow-[0_0_10px_rgba(255,42,133,0.8)] transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Main Manga Reader Scroll Stream */}
      <main className="pt-20 pb-28 max-w-3xl mx-auto px-1 sm:px-4 flex flex-col items-center min-h-screen">
        {loadingPages ? (
          /* Sleek Saitama Lazy Loading State */
          <div className="w-full max-w-md my-24 flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center">
            <SaitamaLoader size="md" text={`Loading Chapter ${currentChapter}...`} />
            <p className="text-xs text-kuro-text-dim mt-2">Fetching high-definition manga pages...</p>
          </div>
        ) : pages.length > 0 ? (
          /* Continuous Vertical Stream of Manga Pages */
          <div className="w-full flex flex-col items-center space-y-1 sm:space-y-2">
            {pages.map((pageUrl, idx) => (
              <div
                key={idx}
                className="relative w-full overflow-hidden bg-black/80 rounded-sm shadow-xl min-h-[400px] flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pageUrl}
                  alt={`Chapter ${currentChapter} - Page ${idx + 1}`}
                  loading={idx < 3 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-auto block select-none"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // If image fails, retry via proxy url
                    if (!target.src.includes("/api/manga-proxy")) {
                      target.src = `/api/manga-proxy?url=${encodeURIComponent(pageUrl)}`;
                    }
                  }}
                />
                {/* Subtle page counter in bottom right */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white/50 font-mono pointer-events-none">
                  {idx + 1} / {pages.length}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Clean Error State with Retry */
          <div className="w-full max-w-md my-24 p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Chapter {currentChapter}</h2>
            <p className="text-xs text-kuro-text-dim mb-6 leading-relaxed">
              Unable to load chapter pages at this moment. Please try refreshing.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-magenta-500 hover:bg-magenta-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,42,133,0.4)] transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Retry Loading Chapter</span>
            </button>
          </div>
        )}

        {/* End of Chapter Navigation Card */}
        {pages.length > 0 && (
          <div className="w-full mt-12 p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center">
            <h3 className="text-base font-bold text-white mb-1">
              Finished Chapter {currentChapter}!
            </h3>
            <p className="text-xs text-kuro-text-dim mb-5">
              Continue reading with the next chapter.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {nextChapter ? (
                <Link
                  href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,42,133,0.4)] hover:scale-105 transition-all"
                >
                  <span>Next: Chapter {nextChapter.chapter}</span>
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="text-xs text-kuro-muted">You have reached the latest chapter!</span>
              )}

              <Link
                href={`/manga/${manga.id}`}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold transition-all"
              >
                Back to Manga Hub
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl text-xs font-semibold">
        {prevChapter && (
          <Link
            href={`/manga/${manga.id}/${prevChapter.chapter}?chId=${encodeURIComponent(prevChapter.id)}`}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Previous Chapter"
          >
            <ChevronLeft size={16} />
          </Link>
        )}

        <button
          onClick={scrollToTop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
        >
          <ArrowUp size={14} />
          <span>{readProgress}%</span>
        </button>

        {nextChapter && (
          <Link
            href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Next Chapter"
          >
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
