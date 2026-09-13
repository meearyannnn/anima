"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  SearchX,
  Film,
  Sparkles,
  Flame,
  Trophy,
  Swords,
  Brain,
  Heart,
  Rocket,
  Laugh,
  Coffee,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/ui/Skeleton";
import { searchAnime, getTrending } from "@/lib/api/anilist";
import { cn } from "@/lib/utils";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import type { AniListMedia } from "@/lib/types";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi",
  "Slice of Life", "Sports", "Supernatural", "Thriller",
];

const FORMATS = [
  { label: "TV Series", value: "TV" },
  { label: "Movie", value: "MOVIE" },
  { label: "OVA", value: "OVA" },
  { label: "Special", value: "SPECIAL" },
];

const STATUSES = [
  { label: "Airing", value: "RELEASING" },
  { label: "Completed", value: "FINISHED" },
  { label: "Upcoming", value: "NOT_YET_RELEASED" },
];

const SORT_OPTIONS = [
  { label: "Most Popular", value: "POPULARITY_DESC" },
  { label: "Trending", value: "TRENDING_DESC" },
  { label: "Highest Score", value: "SCORE_DESC" },
  { label: "Newest Release", value: "START_DATE_DESC" },
];

const QUICK_CATEGORIES = [
  { id: "all", label: "All Titles", icon: Film },
  { id: "trending", label: "Trending", icon: Flame, sort: "TRENDING_DESC" },
  { id: "top-rated", label: "Top Rated", icon: Trophy, sort: "SCORE_DESC" },
  { id: "action", label: "Action", icon: Swords, genre: "Action" },
  { id: "psychological", label: "Psychological", icon: Brain, genre: "Psychological" },
  { id: "romance", label: "Romance", icon: Heart, genre: "Romance" },
  { id: "scifi", label: "Sci-Fi", icon: Rocket, genre: "Sci-Fi" },
  { id: "comedy", label: "Comedy", icon: Laugh, genre: "Comedy" },
  { id: "slice-of-life", label: "Slice of Life", icon: Coffee, genre: "Slice of Life" },
];

const POPULAR_SEARCHES = [
  "Solo Leveling",
  "Jujutsu Kaisen",
  "One Piece",
  "Demon Slayer",
  "Frieren",
  "Chainsaw Man",
  "Attack on Titan",
];

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get("genre") ? [searchParams.get("genre")!] : []
  );
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("POPULARITY_DESC");
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const debouncedQuery = useDebounce(query, 300);

  const hasFilters = Boolean(
    selectedGenres.length > 0 ||
      selectedFormat ||
      selectedStatus ||
      selectedYear ||
      selectedSort !== "POPULARITY_DESC"
  );
  const hasSearch = Boolean(debouncedQuery.trim().length > 0 || hasFilters || activeCategory !== "all");

  // Query search results
  const { data: searchData, isLoading: searchLoading, isFetching: searchFetching } = useQuery({
    queryKey: [
      "search",
      debouncedQuery,
      selectedGenres,
      selectedFormat,
      selectedStatus,
      selectedYear,
      selectedSort,
    ],
    queryFn: () =>
      searchAnime({
        query: debouncedQuery.trim() || undefined,
        genres: selectedGenres.length ? selectedGenres : undefined,
        format: selectedFormat || undefined,
        status: selectedStatus || undefined,
        year: selectedYear,
        sort: selectedSort,
        perPage: 24,
      }),
    enabled: hasSearch,
    placeholderData: keepPreviousData,
  });

  // Trending anime for smart default view and rescue fallback
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["discover-trending"],
    queryFn: () => getTrending(1, 24),
    staleTime: 1000 * 60 * 10,
  });

  const searchResults: AniListMedia[] = searchData?.Page?.media ?? [];
  const trendingResults: AniListMedia[] = trendingData?.Page?.media ?? [];
  const loading = searchLoading || searchFetching;

  // Decide what to display
  const isDefaultView = !hasSearch;
  const displayList = isDefaultView ? trendingResults : searchResults;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleQuickCategory = (cat: typeof QUICK_CATEGORIES[number]) => {
    setActiveCategory(cat.id);
    if (cat.id === "all") {
      clearFilters();
      return;
    }
    if (cat.sort) {
      setSelectedSort(cat.sort);
      setSelectedGenres([]);
    } else if (cat.genre) {
      setSelectedGenres([cat.genre]);
      setSelectedSort("POPULARITY_DESC");
    }
  };

  const handleSuggestionClick = (title: string) => {
    setQuery(title);
    setActiveCategory("all");
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedFormat("");
    setSelectedStatus("");
    setSelectedYear(undefined);
    setSelectedSort("POPULARITY_DESC");
    setActiveCategory("all");
  };

  const clearAll = () => {
    setQuery("");
    clearFilters();
  };

  return (
    <div className="min-h-screen pt-24 pb-28 sm:pb-24 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto">
      {/* ─── Search Hero Header ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <div className="text-center mb-2">
          <DualToneHeading
            as="h1"
            text="Discover Anime"
            className="text-3xl md:text-4xl font-black tracking-tight"
          />
        </div>
        <p className="text-kuro-muted text-center text-xs sm:text-sm mb-6">
          Explore curated genres, live trending releases, and custom filters
        </p>

        {/* Search Bar Input */}
        <div className="relative group">
          <Search
            size={18}
            className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-magenta-400 transition-colors pointer-events-none"
          />
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (activeCategory !== "all") setActiveCategory("all");
            }}
            placeholder="Search anime by title, character, or studio..."
            className={cn(
              "w-full bg-kuro-surface/90 border border-white/10 rounded-2xl pl-12 sm:pl-14 pr-12 py-3.5 sm:py-4",
              "text-white placeholder-white/40 text-sm sm:text-base",
              "focus:outline-none focus:border-magenta-500 focus:shadow-[0_0_25px_rgba(255,42,133,0.3)]",
              "transition-all duration-300 backdrop-blur-md"
            )}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Popular Quick Searches */}
        {!query && (
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-3 pb-1">
            <span className="text-[11px] font-semibold text-white/40 whitespace-nowrap mr-1">
              Popular:
            </span>
            {POPULAR_SEARCHES.map((title) => (
              <button
                key={title}
                onClick={() => handleSuggestionClick(title)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.06] whitespace-nowrap transition-colors"
              >
                {title}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── Smart Quick Discovery Categories (Horizontal Scrollable Chips) ─── */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 max-w-full">
          {QUICK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleQuickCategory(cat)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border touch-manipulation",
                  isActive
                    ? "bg-magenta-500 text-white border-magenta-500 shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                    : "bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.07]"
                )}
              >
                <Icon size={13} className={isActive ? "text-white" : "text-magenta-400"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Toggle Button with Badge */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all border ml-auto",
            showFilters || hasFilters
              ? "bg-magenta-500/20 text-magenta-300 border-magenta-500/50 shadow-sm"
              : "bg-white/[0.03] border-white/10 text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <SlidersHorizontal size={13} />
          <span>Filters</span>
          {hasFilters && (
            <span className="bg-magenta-500 text-white font-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {selectedGenres.length +
                (selectedFormat ? 1 : 0) +
                (selectedStatus ? 1 : 0) +
                (selectedYear ? 1 : 0) +
                (selectedSort !== "POPULARITY_DESC" ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* ─── Expandable Intelligent Filter Panel ────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 rounded-2xl bg-kuro-surface/80 border border-white/10 p-5 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-magenta-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Refine Search</h3>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-magenta-400 hover:text-magenta-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* Sort By */}
              <div>
                <p className="text-white/50 font-bold uppercase tracking-wide text-[10px] mb-2 flex items-center gap-1">
                  <ArrowUpDown size={11} />
                  Sort By
                </p>
                <div className="flex flex-col gap-1">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSelectedSort(s.value)}
                      className={cn(
                        "flex items-center justify-between px-3 py-1.5 rounded-lg border text-left transition-all",
                        selectedSort === s.value
                          ? "bg-magenta-500/15 border-magenta-500/40 text-magenta-300 font-bold"
                          : "bg-white/[0.02] border-white/[0.05] text-white/60 hover:text-white"
                      )}
                    >
                      <span>{s.label}</span>
                      {selectedSort === s.value && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <p className="text-white/50 font-bold uppercase tracking-wide text-[10px] mb-2">Format</p>
                <div className="flex flex-wrap gap-1.5">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setSelectedFormat(selectedFormat === f.value ? "" : f.value)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg font-medium transition-all border",
                        selectedFormat === f.value
                          ? "bg-magenta-500 text-white border-magenta-500 font-bold shadow-sm"
                          : "bg-white/[0.02] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.05]"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-white/50 font-bold uppercase tracking-wide text-[10px] mb-2">Airing Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSelectedStatus(selectedStatus === s.value ? "" : s.value)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg font-medium transition-all border",
                        selectedStatus === s.value
                          ? "bg-magenta-500 text-white border-magenta-500 font-bold shadow-sm"
                          : "bg-white/[0.02] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.05]"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Release Year */}
              <div>
                <p className="text-white/50 font-bold uppercase tracking-wide text-[10px] mb-2">Release Year</p>
                <select
                  value={selectedYear ?? ""}
                  onChange={(e) =>
                    setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  className="w-full bg-kuro-surface border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-magenta-500 cursor-pointer"
                >
                  <option value="">All Release Years</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Genre Multi-select Pills */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/50 font-bold uppercase tracking-wide text-[10px] mb-2">
                Filter by Genres ({selectedGenres.length} selected)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((g) => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                        isSelected
                          ? "bg-magenta-500/20 text-magenta-300 border-magenta-500/40 font-bold"
                          : "bg-white/[0.02] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06]"
                      )}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Results Section Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isDefaultView ? (
            <div className="flex items-center gap-1.5 text-white font-bold text-base sm:text-lg">
              <Flame size={18} className="text-magenta-400" />
              <span>Trending Discoveries</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-white font-bold text-base sm:text-lg">
              <Sparkles size={16} className="text-magenta-400" />
              <span>
                {debouncedQuery ? `Results for "${debouncedQuery}"` : "Filtered Titles"}
              </span>
            </div>
          )}
        </div>

        <span className="text-xs font-mono font-semibold text-white/40">
          {loading ? "Searching..." : `${displayList.length} titles`}
        </span>
      </div>

      {/* ─── Grid of Anime Cards ────────────────────────────────────────────── */}
      {loading && displayList.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      ) : displayList.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
        >
          {displayList.map((a, i) => (
            <AnimeCard key={a.id} anime={a} index={i} />
          ))}
        </motion.div>
      ) : (
        /* ─── Smart Rescue: No Matches Found ────────────────────────────────── */
        <div className="text-center py-12 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 mb-3">
            <SearchX size={26} strokeWidth={1.5} />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            No exact anime matches found
          </h3>
          <p className="text-kuro-muted text-xs max-w-sm mb-5">
            We couldn&apos;t find anything matching &quot;{query}&quot;. Try adjusting your search or check out what&apos;s trending below.
          </p>
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-xl bg-magenta-500 hover:bg-magenta-600 text-white font-bold text-xs transition-all shadow-md mb-8"
          >
            Clear Search & Reset
          </button>

          {/* Rescue Trending Grid */}
          {trendingResults.length > 0 && (
            <div className="w-full text-left pt-6 border-t border-white/10">
              <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Flame size={14} className="text-magenta-400" />
                Trending Anime You Might Like
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {trendingResults.slice(0, 12).map((a, i) => (
                  <AnimeCard key={a.id} anime={a} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
