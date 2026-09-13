"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ArrowUp,
} from "lucide-react";
import { AniListMedia } from "@/lib/types";
import { MangaChapter } from "@/lib/api/manga";
import { cn } from "@/lib/utils";

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
  pages,
}: MangaReaderClientProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [readProgress, setReadProgress] = useState(0);

  const title = manga.title.english || manga.title.romaji;

  // Find current index
  const currentIndex = chapters.findIndex((c) => c.chapter === currentChapter);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, Math.round((window.scrollY / totalHeight) * 100)));
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
        router.push(`/manga/${manga.id}/${prevChapter.chapter}?chId=${prevChapter.id}`);
      } else if (e.key === "ArrowRight" && nextChapter) {
        router.push(`/manga/${manga.id}/${nextChapter.chapter}?chId=${nextChapter.id}`);
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
      router.push(`/manga/${manga.id}/${selected.chapter}?chId=${selected.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* Top Floating Header Controls */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3 bg-black/85 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-4",
          showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
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

        {/* Chapter Picker & Nav */}
        <div className="flex items-center gap-2">
          {/* Previous Chapter */}
          {prevChapter ? (
            <Link
              href={`/manga/${manga.id}/${prevChapter.chapter}?chId=${prevChapter.id}`}
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

          {/* Chapter Selector Dropdown */}
          <select
            value={currentChapter}
            onChange={(e) => handleChapterSelect(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-magenta-500/50 cursor-pointer"
          >
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.chapter} className="bg-kuro-card text-white">
                Ch. {ch.chapter} {ch.title !== `Chapter ${ch.chapter}` ? `— ${ch.title}` : ""}
              </option>
            ))}
          </select>

          {/* Next Chapter */}
          {nextChapter ? (
            <Link
              href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${nextChapter.id}`}
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

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Progress Bar under Top Header */}
      <div className="fixed top-[57px] left-0 right-0 h-1 bg-white/5 z-50">
        <div
          className="h-full bg-gradient-to-r from-magenta-500 to-pink-500 shadow-[0_0_10px_rgba(255,42,133,0.8)] transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Main Reader Scroll Stream */}
      <main className="pt-20 pb-28 max-w-3xl mx-auto px-1 sm:px-4 flex flex-col items-center">
        {pages.length > 0 ? (
          <div className="w-full flex flex-col items-center space-y-2">
            {pages.map((pageUrl, idx) => (
              <div
                key={idx}
                className="relative w-full overflow-hidden bg-black/60 rounded-lg shadow-2xl min-h-[300px] flex items-center justify-center"
              >
                {/* Standard img tag avoids next.config domain issues on dynamic MangaDex CDN node IPs */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pageUrl}
                  alt={`Chapter ${currentChapter} - Page ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-auto block select-none"
                  onError={(e) => {
                    // Fallback notice if single page fails
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Standby Fallback Mode when direct images are restricted or offline */
          <div className="w-full max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} />
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display text-white mb-2">
              Chapter {currentChapter} Ready
            </h2>
            <p className="text-sm text-kuro-text-dim mb-6 leading-relaxed">
              MangaDex reader images for this specific chapter are distributed via decentralized nodes. You can read directly on Kagane or MangaDex with 1-click below:
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <a
                href={`https://kagane.to/search?q=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-magenta-500 hover:bg-magenta-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,42,133,0.4)] transition-all"
              >
                <span>Read on Kagane.to</span>
                <ExternalLink size={14} />
              </a>

              <a
                href={`https://mangadex.org/title/${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-all"
              >
                <span>Read on MangaDex</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-xs text-kuro-muted mb-3">Jump between chapters</p>
              <div className="flex items-center justify-center gap-3">
                {prevChapter && (
                  <Link
                    href={`/manga/${manga.id}/${prevChapter.chapter}?chId=${prevChapter.id}`}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/90 transition-colors"
                  >
                    ← Chapter {prevChapter.chapter}
                  </Link>
                )}
                {nextChapter && (
                  <Link
                    href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${nextChapter.id}`}
                    className="px-4 py-2 rounded-xl bg-magenta-500/20 hover:bg-magenta-500/30 text-magenta-400 border border-magenta-500/30 text-xs font-bold transition-colors"
                  >
                    Chapter {nextChapter.chapter} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* End of Chapter Navigation Card */}
        {pages.length > 0 && (
          <div className="w-full mt-12 p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center">
            <h3 className="text-base font-bold text-white mb-2">
              Finished Chapter {currentChapter}!
            </h3>
            <p className="text-xs text-kuro-text-dim mb-4">
              Continue your reading adventure with the next chapter.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {nextChapter ? (
                <Link
                  href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${nextChapter.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,42,133,0.4)] hover:scale-105 transition-all"
                >
                  <span>Next: Chapter {nextChapter.chapter}</span>
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="text-xs text-kuro-muted">You are caught up to the latest chapter!</span>
              )}

              <Link
                href={`/manga/${manga.id}`}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold transition-all"
              >
                Back to Manga Hub
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Quick Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl text-xs font-semibold">
        {prevChapter && (
          <Link
            href={`/manga/${manga.id}/${prevChapter.chapter}?chId=${prevChapter.id}`}
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
            href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${nextChapter.id}`}
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
