"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Flame,
  Sparkles,
  Trophy,
  Search,
  Star,
  BookOpen,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { AniListMedia } from "@/lib/types";
import { MangaCard } from "@/components/manga/MangaCard";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { cn } from "@/lib/utils";

interface MangaHubClientProps {
  trending: AniListMedia[];
  manhwa: AniListMedia[];
  topRated: AniListMedia[];
}

const POPULAR_TAGS = [
  "Death Note",
  "Solo Leveling",
  "One Piece",
  "Berserk",
  "Jujutsu Kaisen",
  "Chainsaw Man",
  "Bleach",
];

export function MangaHubClient({ trending, manhwa, topRated }: MangaHubClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "trending" | "manhwa" | "top">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AniListMedia[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hero feature: top trending or best available
  const heroManga = trending[0] || manhwa[0] || topRated[0];

  // Debounced global search across entire manga database
  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchExecuted(false);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query)}&perPage=24`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults(data.media || []);
      } catch (err) {
        console.error("Manga search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        setSearchExecuted(true);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchExecuted(false);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen pb-24 md:pb-16 pt-20">
      {/* Hero Spotlight (shown when not actively searching) */}
      {!isSearchActive && heroManga && (
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-gradient-to-br from-kuro-card/90 to-kuro-bg min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-6 sm:p-10">
            {/* Background Image with Ambient Gradient */}
            <div className="absolute inset-0 z-0">
              <Image
                src={heroManga.bannerImage || heroManga.coverImage.extraLarge}
                alt={heroManga.title.english || heroManga.title.romaji}
                fill
                priority
                className="object-cover opacity-35 filter blur-[1px] scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kuro-bg via-kuro-bg/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-kuro-bg via-kuro-bg/60 to-transparent" />
            </div>

            {/* Spotlight Content */}
            <div className="relative z-10 max-w-2xl">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.5)]">
                  <Flame size={14} className="animate-pulse" />
                  #1 SPOTLIGHT
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white/90 border border-white/15">
                  {heroManga.countryOfOrigin === "KR" ? "MANHWA" : "MANGA"}
                </span>
                {heroManga.averageScore && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    <Star size={12} fill="currentColor" />
                    {(heroManga.averageScore / 10).toFixed(1)}
                  </span>
                )}
                {heroManga.chapters ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {heroManga.chapters} Chapters
                  </span>
                ) : null}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-display text-white tracking-tight leading-tight mb-3">
                {heroManga.title.english || heroManga.title.romaji}
              </h1>

              {/* Description */}
              {heroManga.description && (
                <p
                  className="text-kuro-text-dim text-sm sm:text-base line-clamp-2 sm:line-clamp-3 mb-6 max-w-xl leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: heroManga.description.replace(/<[^>]*>?/gm, ""),
                  }}
                />
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/manga/${heroManga.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(255,42,133,0.4)] hover:shadow-[0_0_35px_rgba(255,42,133,0.6)] hover:scale-105 active:scale-95 transition-all"
                >
                  <BookOpen size={16} />
                  <span>Start Reading</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href={`/manga/${heroManga.id}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 text-sm font-semibold border border-white/10 backdrop-blur-md transition-all"
                >
                  <span>View Chapters</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Bar: Title, Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-magenta-400 font-bold flex items-center gap-1.5 mb-1">
              <Sparkles size={12} />
              DIGITAL COMIC LIBRARY
            </span>
            <DualToneHeading text="Manga & Manhwa Vault" />
          </div>

          {/* Quick Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Filter Pills (shown when not actively searching) */}
            {!isSearchActive && (
              <div className="inline-flex items-center bg-white/[0.04] border border-white/10 p-1 rounded-xl backdrop-blur-md">
                <button
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeTab === "all"
                      ? "bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                      : "text-kuro-text-dim hover:text-white"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("trending")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeTab === "trending"
                      ? "bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                      : "text-kuro-text-dim hover:text-white"
                  )}
                >
                  Trending
                </button>
                <button
                  onClick={() => setActiveTab("manhwa")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeTab === "manhwa"
                      ? "bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                      : "text-kuro-text-dim hover:text-white"
                  )}
                >
                  Manhwa
                </button>
                <button
                  onClick={() => setActiveTab("top")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeTab === "top"
                      ? "bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                      : "text-kuro-text-dim hover:text-white"
                  )}
                >
                  Top Rated
                </button>
              </div>
            )}

            {/* Global Manga Search Input */}
            <div className="relative w-full sm:w-64 md:w-80">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kuro-muted"
              />
              <input
                type="text"
                placeholder="Search any manga (e.g. Death Note)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-kuro-muted focus:outline-none focus:border-magenta-500/50 focus:ring-1 focus:ring-magenta-500/50 transition-all shadow-inner"
              />
              {isSearching ? (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-magenta-400 animate-spin"
                />
              ) : searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-kuro-muted hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Quick Search Tag Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <span className="text-[11px] text-kuro-muted font-medium flex-shrink-0">Popular:</span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex-shrink-0 border",
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? "bg-magenta-500/20 text-magenta-400 border-magenta-500/40"
                  : "bg-white/[0.03] text-kuro-text-dim hover:text-white border-white/5 hover:border-white/15"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* ── Active Search Results View ────────────────────────────────────────── */}
        {isSearchActive ? (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 flex items-center justify-center">
                  <Search size={18} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Search Results
                  </h3>
                  <p className="text-xs text-kuro-muted">
                    {isSearching
                      ? `Searching library for "${searchQuery}"...`
                      : `Found ${searchResults.length} manga for "${searchQuery}"`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClearSearch}
                className="text-xs font-semibold text-kuro-text-dim hover:text-magenta-400 transition-colors"
              >
                Clear Search
              </button>
            </div>

            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4.2] rounded-2xl bg-white/[0.04] border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {searchResults.map((manga, idx) => (
                  <MangaCard key={`search-${manga.id}`} manga={manga} priority={idx < 6} />
                ))}
              </div>
            ) : searchExecuted ? (
              <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center max-w-md mx-auto my-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 text-kuro-muted flex items-center justify-center mx-auto mb-3">
                  <Search size={22} />
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  No manga found for &ldquo;{searchQuery}&rdquo;
                </h4>
                <p className="text-xs text-kuro-text-dim mb-4">
                  Check the spelling or try searching for another popular series above.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all"
                >
                  Back to Catalog
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          /* ── Default Catalog Sections ────────────────────────────────────────── */
          <>
            {/* Section 1: Trending Manga */}
            {(activeTab === "all" || activeTab === "trending") && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 flex items-center justify-center">
                      <Flame size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Trending Manga
                      </h3>
                      <p className="text-xs text-kuro-muted">
                        Most read chapters this week worldwide
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {trending.map((manga, idx) => (
                    <MangaCard key={`trending-${manga.id}`} manga={manga} priority={idx < 4} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: Top Korean Manhwa & Webtoons */}
            {(activeTab === "all" || activeTab === "manhwa") && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Top Korean Manhwa & Webtoons
                      </h3>
                      <p className="text-xs text-kuro-muted">
                        Full-color vertical scrolling action & fantasy
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {manhwa.map((manga) => (
                    <MangaCard key={`manhwa-${manga.id}`} manga={manga} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 3: All-Time Masterpieces */}
            {(activeTab === "all" || activeTab === "top") && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        All-Time Masterpieces
                      </h3>
                      <p className="text-xs text-kuro-muted">Highest rated manga in history</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {topRated.map((manga) => (
                    <MangaCard key={`top-${manga.id}`} manga={manga} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
