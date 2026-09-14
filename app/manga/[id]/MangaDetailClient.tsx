"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Play,
  Star,
  Layers,
  Sparkles,
  Search,
  Calendar,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  Tv,
  Eye,
  CheckCircle2,
  Zap,
  BookmarkCheck,
  History,
  RotateCcw,
} from "lucide-react";
import { AniListMedia } from "@/lib/types";
import { MangaChapter } from "@/lib/api/manga";
import { MangaCard } from "@/components/manga/MangaCard";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { cn } from "@/lib/utils";
import { useMangaProgress } from "@/lib/store/useMangaProgress";

interface MangaDetailClientProps {
  manga: AniListMedia;
  chapters: MangaChapter[];
  mangaDexId: string | null;
  animeAdaptation: any | null;
}

export function MangaDetailClient({
  manga,
  chapters,
  mangaDexId,
  animeAdaptation,
}: MangaDetailClientProps) {
  const [chapterFilter, setChapterFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const savedProgress = useMangaProgress((s) => s.progressMap[manga.id]);

  const title = manga.title.english || manga.title.romaji;
  const isManhwa = manga.countryOfOrigin === "KR";

  const filteredChapters = useMemo(() => {
    let result = [...chapters];
    if (chapterFilter.trim()) {
      const q = chapterFilter.toLowerCase();
      result = result.filter(
        (ch) =>
          ch.chapter.includes(q) ||
          ch.title.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const numA = parseFloat(a.chapter) || 0;
      const numB = parseFloat(b.chapter) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });
  }, [chapters, chapterFilter, sortOrder]);

  const firstChapter = chapters[0];

  return (
    <div className="min-h-screen pb-24 md:pb-16 pt-16">
      {/* Banner Backdrop */}
      <div className="relative w-full h-[340px] sm:h-[420px] overflow-hidden">
        <Image
          src={manga.bannerImage || manga.coverImage.extraLarge}
          alt={title}
          fill
          priority
          className="object-cover opacity-35 filter blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kuro-bg via-kuro-bg/70 to-kuro-bg/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-kuro-bg via-kuro-bg/50 to-transparent" />

        {/* Back Link */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <Link
            href="/manga"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/90 hover:text-white border border-white/10 text-xs font-semibold transition-all"
          >
            <ArrowLeft size={16} />
            <span>Back to Manga Hub</span>
          </Link>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-36 sm:-mt-48 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          {/* Manga Poster Card */}
          <div className="w-48 sm:w-60 md:w-64 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.8)] border border-white/15 group">
              <Image
                src={manga.coverImage.extraLarge || manga.coverImage.large}
                alt={title}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-magenta-500 text-white shadow-[0_0_12px_rgba(255,42,133,0.5)]">
                  {isManhwa ? "MANHWA" : "MANGA"}
                </span>
                {manga.status && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white/90 border border-white/20">
                    {manga.status}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats Grid under Poster */}
            <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-kuro-text-dim">
                <span>Rating</span>
                <span className="font-bold text-yellow-400 flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  {manga.averageScore ? `${(manga.averageScore / 10).toFixed(1)} / 10` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-kuro-text-dim">
                <span>Chapters</span>
                <span className="font-bold text-white">{manga.chapters || chapters.length || "Ongoing"}</span>
              </div>
              <div className="flex justify-between items-center text-kuro-text-dim">
                <span>Volumes</span>
                <span className="font-bold text-white">{manga.volumes || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-kuro-text-dim">
                <span>Country</span>
                <span className="font-bold text-white">{manga.countryOfOrigin || "Japan"}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Synopsis, Anime Cross-link, CTA */}
          <div className="flex-1 w-full">
            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-black font-display text-white tracking-tight leading-tight mb-2">
              {title}
            </h1>
            {manga.title.native && (
              <p className="text-sm font-medium text-kuro-muted mb-4">{manga.title.native}</p>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {manga.genres?.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/80"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {isMounted && savedProgress ? (
                <>
                  <Link
                    href={`/manga/${manga.id}/${savedProgress.chapterNumber}${savedProgress.chapterId ? `?chId=${savedProgress.chapterId}` : ""}`}
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-magenta-500 via-pink-500 to-rose-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(255,42,133,0.5)] hover:shadow-[0_0_40px_rgba(255,42,133,0.7)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <BookmarkCheck size={20} className="text-white fill-white/20" />
                    <div className="text-left">
                      <div className="text-[10px] font-black uppercase tracking-wider text-pink-200 leading-tight">
                        Resume Reading
                      </div>
                      <div className="text-sm font-extrabold text-white">
                        Ch. {savedProgress.chapterNumber} • Page {savedProgress.pageIndex + 1}
                      </div>
                    </div>
                  </Link>

                  {firstChapter && firstChapter.chapter !== savedProgress.chapterNumber && (
                    <Link
                      href={`/manga/${manga.id}/${firstChapter.chapter}?chId=${firstChapter.id}`}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/90 hover:text-white font-semibold text-xs transition-all hover:scale-105"
                    >
                      <RotateCcw size={14} className="text-kuro-muted" />
                      <span>Start from Ch. {firstChapter.chapter}</span>
                    </Link>
                  )}
                </>
              ) : (
                firstChapter && (
                  <Link
                    href={`/manga/${manga.id}/${firstChapter.chapter}?chId=${firstChapter.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(255,42,133,0.4)] hover:shadow-[0_0_35px_rgba(255,42,133,0.6)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <BookOpen size={18} />
                    <span>Start Reading (Ch. {firstChapter.chapter})</span>
                  </Link>
                )
              )}

              {/* Anime Adaptation Link (if available) */}
              {animeAdaptation && (
                <Link
                  href={`/anime/${animeAdaptation.id}`}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 font-bold text-sm border border-cyan-500/30 hover:border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:scale-105 transition-all"
                >
                  <Tv size={18} className="text-cyan-400" />
                  <span>Watch Anime Adaptation</span>
                </Link>
              )}
            </div>

            {/* Smart Resume Reading Progress Card */}
            {isMounted && savedProgress && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-magenta-950/30 via-purple-950/20 to-black/40 border border-magenta-500/25 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-magenta-500/20 border border-magenta-500/30 flex items-center justify-center text-magenta-400 flex-shrink-0">
                    <History size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-magenta-500/20 text-magenta-300 border border-magenta-500/30">
                        Smart Progress
                      </span>
                      <span className="text-xs text-kuro-muted">
                        Page {savedProgress.pageIndex + 1} of {savedProgress.totalPages || "?"}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1">
                      Chapter {savedProgress.chapterNumber}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full sm:w-48 h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-magenta-500 to-pink-400 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((savedProgress.pageIndex + 1) /
                                Math.max(savedProgress.totalPages, 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Link
                  href={`/manga/${manga.id}/${savedProgress.chapterNumber}${savedProgress.chapterId ? `?chId=${savedProgress.chapterId}` : ""}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-magenta-500 hover:bg-magenta-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(255,42,133,0.35)] transition-all flex-shrink-0"
                >
                  <BookmarkCheck size={14} />
                  <span>Resume Page {savedProgress.pageIndex + 1}</span>
                </Link>
              </div>
            )}

            {/* Cross-Link Spotlight Banner for Anime */}
            {animeAdaptation && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-16 relative rounded-lg overflow-hidden border border-white/20 flex-shrink-0">
                    <Image
                      src={animeAdaptation.coverImage?.large || manga.coverImage.large}
                      alt={animeAdaptation.title?.english || "Anime"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        ANIME ADAPTATION
                      </span>
                      {animeAdaptation.episodes && (
                        <span className="text-xs text-kuro-muted">
                          {animeAdaptation.episodes} Episodes
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                      {animeAdaptation.title?.english || animeAdaptation.title?.romaji}
                    </h4>
                    <p className="text-xs text-kuro-text-dim">Stream the full anime adaptation right now</p>
                  </div>
                </div>

                <Link
                  href={`/anime/${animeAdaptation.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex-shrink-0"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Stream Anime</span>
                </Link>
              </div>
            )}

            {/* Synopsis */}
            {manga.description && (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-kuro-muted mb-2">
                  Synopsis
                </h3>
                <p className="text-kuro-text-dim text-sm leading-relaxed">
                  {manga.description.replace(/<[^>]*>?/gm, "")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chapters Section */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <DualToneHeading text={`Chapters (${filteredChapters.length})`} as="h2" className="text-xl sm:text-2xl" />
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 font-bold inline-flex items-center gap-1.5">
                {mangaDexId ? (
                  <>
                    <Zap size={11} className="fill-magenta-400 text-magenta-400" />
                    MangaDex Stream
                  </>
                ) : (
                  <>
                    <BookOpen size={11} />
                    Complete Catalog
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kuro-muted" />
                <input
                  type="text"
                  placeholder="Search chapter #..."
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-kuro-muted focus:outline-none focus:border-magenta-500/50 w-44 transition-all"
                />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-kuro-text-dim hover:text-white transition-colors"
              >
                {sortOrder === "asc" ? "Oldest First" : "Newest First"}
              </button>
            </div>
          </div>

          {/* Chapter List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredChapters.map((ch) => {
              const isCurrentReading = isMounted && savedProgress?.chapterNumber === ch.chapter;
              return (
                <Link
                  key={ch.id}
                  href={`/manga/${manga.id}/${ch.chapter}?chId=${ch.id}`}
                  className={cn(
                    "group p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
                    isCurrentReading
                      ? "bg-magenta-950/20 border-magenta-500/50 shadow-[0_0_20px_rgba(255,42,133,0.2)]"
                      : "bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-magenta-500/30 hover:shadow-[0_0_20px_rgba(255,42,133,0.15)]"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all",
                        isCurrentReading
                          ? "bg-magenta-500 text-white shadow-[0_0_12px_rgba(255,42,133,0.5)]"
                          : "bg-magenta-500/10 text-magenta-400 border border-magenta-500/20 group-hover:scale-110 group-hover:bg-magenta-500 group-hover:text-white"
                      )}
                    >
                      {ch.chapter}
                    </div>
                    <div className="overflow-hidden">
                      <p
                        className={cn(
                          "text-xs font-bold transition-colors truncate",
                          isCurrentReading ? "text-pink-300" : "text-white group-hover:text-magenta-400"
                        )}
                      >
                        {ch.title || `Chapter ${ch.chapter}`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[10px] text-kuro-muted truncate">
                          {ch.pages > 0 ? `${ch.pages} pages` : "Digital release"}
                        </p>
                        {isCurrentReading && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-magenta-500/30 text-pink-200 border border-magenta-500/40">
                            Page {savedProgress.pageIndex + 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
                      isCurrentReading
                        ? "bg-magenta-500 text-white"
                        : "bg-white/5 text-kuro-muted group-hover:text-white group-hover:bg-magenta-500/20"
                    )}
                  >
                    <ChevronRight size={14} />
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredChapters.length === 0 && (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <BookOpen size={32} className="mx-auto text-kuro-muted mb-2" />
              <p className="text-sm text-kuro-muted">No chapters match your search.</p>
            </div>
          )}
        </section>

        {/* Recommended Manga */}
        {manga.recommendations?.nodes && manga.recommendations.nodes.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-magenta-400" />
              <DualToneHeading text="You Might Also Like" as="h3" className="text-xl sm:text-2xl" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {manga.recommendations.nodes
                .slice(0, 5)
                .map((rec) =>
                  rec.mediaRecommendation ? (
                    <MangaCard key={rec.mediaRecommendation.id} manga={rec.mediaRecommendation} />
                  ) : null
                )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
