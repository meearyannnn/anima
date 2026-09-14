"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Bookmark,
  Check,
  Compass,
} from "lucide-react";
import { AniListMedia } from "@/lib/types";
import { MangaCard } from "@/components/manga/MangaCard";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { cn } from "@/lib/utils";
import { useMyList } from "@/lib/store/useMyList";
import { useToast } from "@/lib/store/useToast";

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

  const { isInList, addToList, removeFromList } = useMyList();
  const { success, info } = useToast();

  // Hero feature: top trending or best available
  const heroManga = trending[0] || manhwa[0] || topRated[0];
  const heroTitle = heroManga?.title?.english || heroManga?.title?.romaji || "Featured Manga";
  const inVault = heroManga ? isInList(heroManga.id) : false;

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

  const toggleVaultHero = () => {
    if (!heroManga) return;
    if (inVault) {
      removeFromList(heroManga.id);
      info("Removed from Vault");
    } else {
      addToList({
        id: heroManga.id,
        title: heroTitle,
        coverImage: heroManga.coverImage?.extraLarge || heroManga.coverImage?.large || "",
        genres: heroManga.genres || [],
        averageScore: heroManga.averageScore,
        episodes: heroManga.chapters ?? null,
        status: heroManga.status || "FINISHED",
        category: "planning",
        type: "MANGA",
      });
      success("Saved to Vault");
    }
  };

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen pb-24 md:pb-16 pt-24">
      {/* ── Cinematic Hero Spotlight (shown when not actively searching) ────── */}
      {!isSearchActive && heroManga && (
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 mb-14">
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.8)] bg-black/60 backdrop-blur-3xl min-h-[420px] sm:min-h-[480px] p-6 sm:p-10 md:p-12 flex flex-col justify-center">
            {/* Ambient Blurred Background Banner */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <Image
                src={heroManga.bannerImage || heroManga.coverImage.extraLarge}
                alt={heroTitle}
                fill
                priority
                className="object-cover opacity-25 filter blur-md scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
              {/* Soft Neon Backlight Glow */}
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-magenta-500/20 rounded-full blur-[120px] pointer-events-none" />
            </div>

            {/* Content & Floating Poster Dual Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Column: Title & Info */}
              <div className="md:col-span-8 lg:col-span-7 space-y-4">
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-magenta-500 to-pink-500 text-white shadow-[0_0_20px_rgba(255,42,133,0.5)]">
                    <Flame size={14} className="animate-pulse text-white" />
                    #1 SPOTLIGHT
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/10 text-white border border-white/15 backdrop-blur-md">
                    {heroManga.countryOfOrigin === "KR" ? "KOREAN MANHWA" : "JAPANESE MANGA"}
                  </span>

                  {heroManga.averageScore && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {(heroManga.averageScore / 10).toFixed(1)} Rating
                    </span>
                  )}

                  {heroManga.chapters ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {heroManga.chapters} Chapters
                    </span>
                  ) : null}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-[1.1] text-gradient">
                  {heroTitle}
                </h1>

                {/* Genre Tags */}
                {heroManga.genres && heroManga.genres.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {heroManga.genres.slice(0, 4).map((genre) => (
                      <span
                        key={genre}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/[0.06] text-white/80 border border-white/10"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Synopsis */}
                {heroManga.description && (
                  <p className="text-white/70 text-sm sm:text-base line-clamp-3 max-w-2xl leading-relaxed pt-1 font-normal">
                    {heroManga.description.replace(/<[^>]*>?/gm, "")}
                  </p>
                )}

                {/* Hero Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <Link
                    href={`/manga/${heroManga.id}`}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-magenta-500 via-pink-500 to-rose-500 text-white font-extrabold text-sm shadow-[0_0_30px_rgba(255,42,133,0.5)] hover:shadow-[0_0_40px_rgba(255,42,133,0.7)] hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <BookOpen size={18} />
                    <span>Start Reading</span>
                    <ArrowRight size={16} />
                  </Link>

                  <button
                    onClick={toggleVaultHero}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-xs font-bold border backdrop-blur-md transition-all duration-300",
                      inVault
                        ? "bg-magenta-500/20 text-magenta-300 border-magenta-500/40 shadow-[0_0_15px_rgba(255,42,133,0.3)]"
                        : "bg-white/10 hover:bg-white/15 text-white border-white/15"
                    )}
                  >
                    {inVault ? <Check size={16} /> : <Bookmark size={16} />}
                    <span>{inVault ? "In Vault" : "Save to Vault"}</span>
                  </button>

                  <Link
                    href={`/manga/${heroManga.id}`}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/80 text-xs font-bold border border-white/10 transition-all"
                  >
                    <span>View Chapters</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: 3D Floating Poster Card (Medium+ screens) */}
              <div className="hidden md:flex md:col-span-4 lg:col-span-5 justify-center relative">
                <div className="relative group">
                  {/* Glowing Poster Aura */}
                  <div className="absolute -inset-2 bg-gradient-to-tr from-magenta-500 to-pink-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-80 transition-all duration-500" />

                  {/* Poster Image Container */}
                  <div className="relative w-56 sm:w-64 lg:w-72 aspect-[3/4.4] rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-transform duration-500 group-hover:scale-[1.03]">
                    <Image
                      src={heroManga.coverImage.extraLarge || heroManga.coverImage.large}
                      alt={heroTitle}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Main Catalog Section ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Bar: Title & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-magenta-400 font-bold flex items-center gap-1.5 mb-1">
              <Sparkles size={13} />
              DIGITAL COMIC VAULT
            </span>
            <DualToneHeading text="Explore Manga & Manhwa" />
          </div>

          {/* Controls Capsule Dock: Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Pills Dock (shown when not actively searching) */}
            {!isSearchActive && (
              <nav className="inline-flex items-center gap-1 bg-black/40 border border-white/[0.08] p-1.5 rounded-full backdrop-blur-2xl shadow-inner shadow-black/50">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "trending", label: "Trending" },
                    { id: "manhwa", label: "Manhwa" },
                    { id: "top", label: "Top Rated" },
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 select-none",
                        isActive
                          ? "text-white font-bold"
                          : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="manga-tab-pill"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-magenta-500/30 via-pink-500/25 to-purple-500/30 border border-magenta-500/40 shadow-[0_0_15px_rgba(255,42,133,0.35)]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Global Manga Search Input Capsule */}
            <div className="relative w-full sm:w-64 md:w-72">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search any manga title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-white/40 focus:outline-none focus:border-magenta-500/50 focus:shadow-[0_0_20px_rgba(255,42,133,0.2)] transition-all duration-300 backdrop-blur-md"
              />
              {isSearching ? (
                <Loader2
                  size={14}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-magenta-400 animate-spin"
                />
              ) : searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Quick Search Popular Tags Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 hide-scrollbar">
          <span className="text-[11px] text-white/40 font-semibold flex-shrink-0">Popular:</span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 flex-shrink-0 border",
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? "bg-magenta-500/20 text-magenta-300 border-magenta-500/40 shadow-[0_0_12px_rgba(255,42,133,0.25)]"
                  : "bg-white/[0.03] text-white/60 hover:text-white border-white/[0.06] hover:bg-white/[0.07]"
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
                <div className="w-8 h-8 rounded-full bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 flex items-center justify-center">
                  <Search size={16} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Search Results
                  </h3>
                  <p className="text-xs text-white/40">
                    {isSearching
                      ? `Searching library for "${searchQuery}"...`
                      : `Found ${searchResults.length} manga for "${searchQuery}"`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClearSearch}
                className="text-xs font-semibold text-white/60 hover:text-magenta-400 transition-colors"
              >
                Clear Search
              </button>
            </div>

            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4.2] rounded-2xl bg-white/[0.04] border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {searchResults.map((manga, idx) => (
                  <MangaCard key={`search-${manga.id}`} manga={manga} priority={idx < 6} />
                ))}
              </div>
            ) : searchExecuted ? (
              <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center max-w-md mx-auto my-8 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-full bg-white/5 text-white/40 flex items-center justify-center mx-auto mb-3">
                  <Search size={22} />
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  No manga found for &ldquo;{searchQuery}&rdquo;
                </h4>
                <p className="text-xs text-white/50 mb-4">
                  Check the spelling or try searching for another popular series above.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all"
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
              <section className="mb-14">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 flex items-center justify-center">
                      <Flame size={16} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Trending Manga
                      </h3>
                      <p className="text-xs text-white/40">
                        Most read chapters this week worldwide
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {trending.map((manga, idx) => (
                    <MangaCard key={`trending-${manga.id}`} manga={manga} priority={idx < 4} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: Top Korean Manhwa & Webtoons */}
            {(activeTab === "all" || activeTab === "manhwa") && (
              <section className="mb-14">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Top Korean Manhwa & Webtoons
                      </h3>
                      <p className="text-xs text-white/40">
                        Full-color vertical scrolling action & fantasy
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {manhwa.map((manga) => (
                    <MangaCard key={`manhwa-${manga.id}`} manga={manga} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 3: All-Time Masterpieces */}
            {(activeTab === "all" || activeTab === "top") && (
              <section className="mb-14">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        All-Time Masterpieces
                      </h3>
                      <p className="text-xs text-white/40">Highest rated manga in history</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

