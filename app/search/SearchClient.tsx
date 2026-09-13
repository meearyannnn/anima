"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  Compass,
  Play,
  Bookmark,
  Star,
} from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/ui/Skeleton";
import { searchAnime, getTrending, getTopAnime } from "@/lib/api/anilist";
import { cn, getAnimeTitle, formatScore } from "@/lib/utils";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { useMyList } from "@/lib/store/useMyList";
import { useToast } from "@/lib/store/useToast";
import {
  analyzeTasteProfile,
  calculateSmartMatch,
  type TasteProfile,
  type SmartRecommendation,
} from "@/lib/ai/tasteEngine";
import { VIBE_ARCHETYPES, type VibeArchetype } from "@/lib/ai/vibePresets";
import type { AniListMedia } from "@/lib/types";

// ─── Filter Constants for Explore Mode ────────────────────────────────────────

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

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mode switcher: "explore" vs "ai"
  const initialMode = searchParams.get("mode") === "ai" ? "ai" : "explore";
  const [activeTab, setActiveTab] = useState<"explore" | "ai">(initialMode);

  // Sync mode if query params change externally
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "ai" && activeTab !== "ai") {
      setActiveTab("ai");
    } else if (!modeParam && activeTab !== "explore") {
      setActiveTab("explore");
    }
  }, [searchParams, activeTab]);

  const switchTab = (tab: "explore" | "ai") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "ai") {
      params.set("mode", "ai");
    } else {
      params.delete("mode");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  // ─── Explore Mode State ───────────────────────────────────────────────────
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

  // Explore search query
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
    enabled: hasSearch && activeTab === "explore",
    placeholderData: keepPreviousData,
  });

  // Trending anime for discover defaults
  const { data: trendingData } = useQuery({
    queryKey: ["discover-trending"],
    queryFn: () => getTrending(1, 24),
    staleTime: 1000 * 60 * 10,
  });

  const searchResults: AniListMedia[] = searchData?.Page?.media ?? [];
  const trendingResults: AniListMedia[] = trendingData?.Page?.media ?? [];
  const loadingExplore = searchLoading || searchFetching;
  const isDefaultExploreView = !hasSearch;
  const displayExploreList = isDefaultExploreView ? trendingResults : searchResults;

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

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedFormat("");
    setSelectedStatus("");
    setSelectedYear(undefined);
    setSelectedSort("POPULARITY_DESC");
    setActiveCategory("all");
  };

  const clearAllExplore = () => {
    setQuery("");
    clearFilters();
  };

  // ─── AI Neural Match State ────────────────────────────────────────────────
  const { history } = useWatchHistory();
  const { list: myList, isInList, addToList, removeFromList } = useMyList();
  const { success, info } = useToast();

  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState<VibeArchetype | null>(null);
  const [aiFormat, setAiFormat] = useState<"all" | "tv" | "movie">("all");
  const [aiMediaList, setAiMediaList] = useState<AniListMedia[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const tasteProfile: TasteProfile = useMemo(() => {
    return analyzeTasteProfile(history, myList);
  }, [history, myList]);

  const fetchAiRecommendations = useCallback(
    async (queryText?: string, archetype?: VibeArchetype | null) => {
      setAiLoading(true);
      try {
        let results: AniListMedia[] = [];

        if (archetype) {
          const res = await searchAnime({
            query: archetype.query.split(" ")[0],
            genres: archetype.genres.slice(0, 2),
            perPage: 24,
          });
          results = res.Page.media;
        } else if (queryText && queryText.trim().length > 0) {
          const res = await searchAnime({
            query: queryText.trim(),
            perPage: 24,
          });
          results = res.Page.media;
        } else {
          const [trending, top] = await Promise.all([
            getTrending(1, 16),
            getTopAnime(16),
          ]);
          const combined = [...trending.Page.media, ...top.Page.media];
          const ids = new Set<number>();
          results = combined.filter((m) => {
            if (ids.has(m.id)) return false;
            ids.add(m.id);
            return true;
          });
        }

        setAiMediaList(results);
      } catch (err) {
        console.error("Failed to fetch AI suggestions:", err);
      } finally {
        setAiLoading(false);
      }
    },
    []
  );

  // Initialize AI recommendations when AI tab is active
  useEffect(() => {
    if (activeTab === "ai" && aiMediaList.length === 0 && !aiLoading) {
      fetchAiRecommendations();
    }
  }, [activeTab, aiMediaList.length, aiLoading, fetchAiRecommendations]);

  const aiRecommendations: SmartRecommendation[] = useMemo(() => {
    if (!aiMediaList.length) return [];
    let filtered = aiMediaList;
    if (aiFormat === "tv") {
      filtered = filtered.filter((m) => m.format === "TV" || m.format === "TV_SHORT");
    } else if (aiFormat === "movie") {
      filtered = filtered.filter((m) => m.format === "MOVIE");
    }
    return filtered
      .map((anime) => calculateSmartMatch(anime, tasteProfile, aiPrompt, selectedArchetype))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [aiMediaList, tasteProfile, aiPrompt, selectedArchetype, aiFormat]);

  const handleSelectArchetype = (arch: VibeArchetype) => {
    if (selectedArchetype?.id === arch.id) {
      setSelectedArchetype(null);
      fetchAiRecommendations(aiPrompt);
    } else {
      setSelectedArchetype(arch);
      fetchAiRecommendations(undefined, arch);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-28 sm:pb-24 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto">
      {/* ─── Hero Header & Mode Switcher ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto mb-8 text-center"
      >
        <DualToneHeading
          as="h1"
          text="Discover & AI Match"
          className="text-3xl md:text-4xl font-black tracking-tight mb-2"
        />
        <p className="text-kuro-muted text-xs sm:text-sm mb-6 max-w-xl mx-auto">
          Explore comprehensive anime catalogues, live trending hits, or discover personal picks curated by KuroAI.
        </p>

        {/* Unified Mode Switcher Tabs */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-lg">
          <button
            onClick={() => switchTab("explore")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all touch-manipulation",
              activeTab === "explore"
                ? "bg-gradient-to-r from-magenta-500 to-pink-500 text-white shadow-[0_0_20px_rgba(255,42,133,0.4)]"
                : "text-white/60 hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <Compass size={16} />
            <span>Catalogue & Explore</span>
          </button>

          <button
            onClick={() => switchTab("ai")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all touch-manipulation relative",
              activeTab === "ai"
                ? "bg-gradient-to-r from-magenta-500 to-pink-500 text-white shadow-[0_0_20px_rgba(255,42,133,0.4)]"
                : "text-white/60 hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <Sparkles size={16} />
            <span>AI Neural Match</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white/20 text-white ml-0.5">
              PRO
            </span>
          </button>
        </div>
      </motion.div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: CATALOGUE & EXPLORE MODE                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "explore" && (
        <motion.div
          key="explore-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {/* Search Bar Input */}
          <div className="max-w-2xl mx-auto mb-6">
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
                    onClick={() => {
                      setQuery(title);
                      setActiveCategory("all");
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.06] whitespace-nowrap transition-colors"
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Discovery Categories */}
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

            {/* Filter Toggle Button */}
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

          {/* Expandable Filter Panel */}
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
                  {/* Sort */}
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

                {/* Genre Multi-select */}
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

          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isDefaultExploreView ? (
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
              {loadingExplore ? "Searching..." : `${displayExploreList.length} titles`}
            </span>
          </div>

          {/* Grid of Anime Cards */}
          {loadingExplore && displayExploreList.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 18 }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          ) : displayExploreList.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
            >
              {displayExploreList.map((a, i) => (
                <AnimeCard key={a.id} anime={a} index={i} />
              ))}
            </motion.div>
          ) : (
            /* Smart Rescue fallback */
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
                onClick={clearAllExplore}
                className="px-4 py-2 rounded-xl bg-magenta-500 hover:bg-magenta-600 text-white font-bold text-xs transition-all shadow-md mb-8"
              >
                Clear Search & Reset
              </button>

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
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: AI NEURAL MATCH MODE                                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "ai" && (
        <motion.div
          key="ai-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-6"
        >
          {/* Natural Language Vibe Input */}
          <div className="relative group max-w-2xl mx-auto">
            <Sparkles
              size={18}
              className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-magenta-400 transition-transform group-focus-within:scale-110 pointer-events-none"
            />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchAiRecommendations(aiPrompt, selectedArchetype);
                }
              }}
              placeholder="Describe what vibe you want (e.g. 'dark mystery with high stakes' or 'cozy anime after work')..."
              className={cn(
                "w-full bg-kuro-surface/90 border border-white/10 rounded-2xl pl-12 sm:pl-14 pr-24 py-3.5 sm:py-4",
                "text-white placeholder-white/40 text-xs sm:text-sm",
                "focus:outline-none focus:border-magenta-500 focus:shadow-[0_0_25px_rgba(255,42,133,0.3)]",
                "transition-all duration-300 backdrop-blur-md"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {aiPrompt && (
                <button
                  onClick={() => {
                    setAiPrompt("");
                    fetchAiRecommendations("", selectedArchetype);
                  }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
                  title="Clear prompt"
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => fetchAiRecommendations(aiPrompt, selectedArchetype)}
                className="px-3 py-1.5 rounded-xl bg-magenta-500 hover:bg-magenta-600 text-white font-bold text-xs transition-all shadow-sm"
              >
                Match
              </button>
            </div>
          </div>

          {/* Vibe Archetypes Selector Chips (Lucide Icons, No Emojis) */}
          <div>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-2">
              Select a Vibe Archetype
            </p>
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
              {VIBE_ARCHETYPES.map((arch) => {
                const IconComponent = arch.lucideIcon;
                const isSelected = selectedArchetype?.id === arch.id;

                return (
                  <button
                    key={arch.id}
                    onClick={() => handleSelectArchetype(arch)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border touch-manipulation",
                      isSelected
                        ? "bg-magenta-500 text-white border-magenta-500 shadow-[0_0_20px_rgba(255,42,133,0.4)] scale-[1.02]"
                        : "bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.07]"
                    )}
                  >
                    <IconComponent size={14} className={isSelected ? "text-white" : "text-magenta-400"} />
                    <span>{arch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Filter Row & Title Count */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50 font-bold">Format:</span>
              {(["all", "tv", "movie"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setAiFormat(fmt)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all border",
                    aiFormat === fmt
                      ? "bg-magenta-500/20 text-magenta-300 border-magenta-500/40"
                      : "bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white"
                  )}
                >
                  {fmt === "all" ? "All Formats" : fmt === "tv" ? "TV Series" : "Movies"}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono font-semibold text-white/40">
              {aiLoading ? "Matching..." : `${aiRecommendations.length} Curated Matches`}
            </span>
          </div>

          {/* AI Recommendations Grid */}
          {aiLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-56 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse"
                />
              ))}
            </div>
          ) : aiRecommendations.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
              <Sparkles size={28} className="text-magenta-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">No AI matches found</h4>
              <p className="text-xs text-white/40 max-w-xs mx-auto mb-4">
                Try switching archetypes or searching with a different vibe prompt.
              </p>
              <button
                onClick={() => {
                  setSelectedArchetype(null);
                  setAiPrompt("");
                  fetchAiRecommendations();
                }}
                className="px-4 py-2 rounded-xl bg-magenta-500 hover:bg-magenta-600 text-white font-bold text-xs transition-all shadow-md"
              >
                Reset AI Match
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiRecommendations.map((rec, index) => {
                const anime = rec.anime;
                const title = getAnimeTitle(anime.title);
                const inVault = isInList(anime.id);

                return (
                  <motion.div
                    key={anime.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(0.2, index * 0.04) }}
                    className="group relative rounded-2xl bg-kuro-surface/80 border border-white/[0.08] hover:border-magenta-500/30 p-4 transition-all duration-200 flex flex-col gap-3 backdrop-blur-md shadow-lg"
                  >
                    {/* Top row: Cover & Information */}
                    <div className="flex gap-3.5 items-start">
                      <Link
                        href={`/anime/${anime.id}`}
                        className="relative w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/[0.08] shadow-md group-hover:scale-[1.02] transition-transform"
                      >
                        {anime.coverImage?.large && (
                          <Image
                            src={anime.coverImage.large}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        )}
                      </Link>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Match Score & Rating Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-magenta-500/20 text-magenta-300 text-[10px] font-mono font-black border border-magenta-500/40">
                            <Sparkles size={10} className="text-magenta-400" />
                            {rec.matchScore}% Match
                          </span>
                          {anime.averageScore && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-white/60 font-semibold">
                              <Star size={10} className="fill-amber-400 text-amber-400" />
                              {formatScore(anime.averageScore)}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <Link href={`/anime/${anime.id}`} className="block">
                          <h4 className="text-sm font-black text-white group-hover:text-magenta-300 transition-colors line-clamp-2 leading-snug">
                            {title}
                          </h4>
                        </Link>

                        {/* Metadata line */}
                        <p className="text-[11px] text-white/40 font-mono">
                          {anime.format || "TV"} · {anime.episodes ? `${anime.episodes} eps` : "Airing"} · {anime.seasonYear || ""}
                        </p>

                        {/* Studio tag */}
                        {anime.studios?.nodes?.[0]?.name && (
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-white/60 border border-white/[0.06]">
                            {anime.studios.nodes[0].name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Contextual Rationale */}
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-2.5">
                      <p className="text-[11px] text-white/70 leading-relaxed line-clamp-2">
                        {rec.rationale}
                      </p>
                    </div>

                    {/* Vibe Tags */}
                    {rec.vibeTags?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {rec.vibeTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono text-white/40 px-1.5 py-0.5 rounded bg-white/[0.02]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Actions: Watch + Vault */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] mt-auto">
                      <Link
                        href={`/watch/${anime.id}/1`}
                        className="flex-1 py-2 px-3 rounded-xl bg-magenta-500 hover:bg-magenta-600 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Play size={12} className="fill-white" />
                        <span>Watch Now</span>
                      </Link>

                      <button
                        onClick={() => {
                          if (inVault) {
                            removeFromList(anime.id);
                            info("Removed from Vault");
                          } else {
                            addToList({
                              id: anime.id,
                              title,
                              coverImage: anime.coverImage?.large ?? "",
                              genres: anime.genres || [],
                              averageScore: anime.averageScore,
                              episodes: anime.episodes,
                              status: anime.status || "FINISHED",
                              category: "planning",
                            });
                            success("Saved to Vault");
                          }
                        }}
                        title={inVault ? "In Vault" : "Save to Vault"}
                        className={cn(
                          "p-2 rounded-xl border transition-all touch-manipulation",
                          inVault
                            ? "bg-magenta-500/20 text-magenta-300 border-magenta-500/40"
                            : "bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border-white/[0.08]"
                        )}
                      >
                        {inVault ? <Check size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
