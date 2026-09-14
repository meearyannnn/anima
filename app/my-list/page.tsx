"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Play,
  Star,
  Bookmark,
  Sparkles,
  Search,
  Compass,
  Film,
  BookOpen,
  Check,
  Flame,
  ArrowUpDown,
  ArrowRight,
  TrendingUp,
  Tv,
} from "lucide-react";
import { useMyList } from "@/lib/store/useMyList";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { useToast } from "@/lib/store/useToast";
import { Button } from "@/components/ui/Button";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { cn } from "@/lib/utils";
import type { MyListItem, WatchlistCategory } from "@/lib/types";

type MediaTypeFilter = "ALL" | "ANIME" | "MANGA";
type CategoryFilter = "ALL" | WatchlistCategory;
type SortOption = "ADDED_DESC" | "SCORE_DESC" | "TITLE_ASC";

function isMangaItem(item: MyListItem): boolean {
  if (item.type === "MANGA") return true;
  if (item.type === "ANIME") return false;
  // Auto-detection for items saved before explicit type property
  return item.episodes === null || (item.id > 100000 && !item.episodes);
}

export default function MyListPage() {
  const { list, removeFromList, updateCategory } = useMyList();
  const { history } = useWatchHistory();
  const { info, success } = useToast();

  const [mediaType, setMediaType] = useState<MediaTypeFilter>("ALL");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("ADDED_DESC");

  const handleRemove = (id: number, title: string) => {
    removeFromList(id);
    info(`Removed "${title}" from your Vault`);
  };

  const handleCategoryChange = (id: number, title: string, category: WatchlistCategory) => {
    updateCategory(id, category);
    const categoryLabels: Record<WatchlistCategory, string> = {
      watching: "Active Shelf",
      planning: "Plan Shelf",
      completed: "Completed Shelf",
    };
    success(`Moved "${title}" to ${categoryLabels[category]}`);
  };

  // Split list by media type
  const animeList = useMemo(() => list.filter((i) => !isMangaItem(i)), [list]);
  const mangaList = useMemo(() => list.filter((i) => isMangaItem(i)), [list]);

  const currentMediaList = useMemo(() => {
    if (mediaType === "ANIME") return animeList;
    if (mediaType === "MANGA") return mangaList;
    return list;
  }, [mediaType, animeList, mangaList, list]);

  // Dynamic counts for media tabs
  const allCount = list.length;
  const animeCount = animeList.length;
  const mangaCount = mangaList.length;

  // Category counts within currently selected media filter
  const watchingCount = currentMediaList.filter((i) => (i.category || "watching") === "watching").length;
  const planningCount = currentMediaList.filter((i) => i.category === "planning").length;
  const completedCount = currentMediaList.filter((i) => i.category === "completed").length;

  // Filter & Sort list
  const filteredList = useMemo(() => {
    return currentMediaList
      .filter((item) => {
        const matchesQuery = item.title.toLowerCase().includes(filterQuery.toLowerCase());
        const itemCategory = item.category || "watching";
        const matchesCategory = activeCategory === "ALL" ? true : itemCategory === activeCategory;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "SCORE_DESC") {
          return (b.averageScore || 0) - (a.averageScore || 0);
        }
        if (sortBy === "TITLE_ASC") {
          return a.title.localeCompare(b.title);
        }
        // ADDED_DESC
        return b.addedAt - a.addedAt;
      });
  }, [currentMediaList, filterQuery, activeCategory, sortBy]);

  // Smart Analytics Calculations
  const analytics = useMemo(() => {
    const totalEpisodes = animeList.reduce((acc, curr) => acc + (curr.episodes || 0), 0);
    const estimatedHours = (totalEpisodes * 23 / 60).toFixed(0);
    const totalChapters = mangaList.reduce((acc, curr) => acc + (curr.episodes || 0), 0);

    const scoredItems = list.filter((i) => i.averageScore);
    const avgScore =
      scoredItems.length > 0
        ? (
            scoredItems.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) /
            scoredItems.length /
            10
          ).toFixed(1)
        : null;

    // Calculate top 3 genres across Vault
    const genreMap: Record<string, number> = {};
    list.forEach((item) => {
      item.genres?.forEach((g) => {
        genreMap[g] = (genreMap[g] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    return { totalEpisodes, estimatedHours, totalChapters, avgScore, topGenres };
  }, [list, animeList, mangaList]);

  // Smart Pick of the Day: Pick top unwatched or top rated item in "watching" shelf
  const smartPick = useMemo(() => {
    const watchingItems = currentMediaList.filter((i) => (i.category || "watching") === "watching");
    if (!watchingItems.length) return currentMediaList[0] || null;
    return (
      watchingItems.find((i) => history.some((h) => h.animeId === i.id)) ||
      watchingItems[0] ||
      null
    );
  }, [currentMediaList, history]);

  const smartPickIsManga = smartPick ? isMangaItem(smartPick) : false;
  const smartPickHistory = smartPick ? history.find((h) => h.animeId === smartPick.id) : null;
  const smartPickEp = smartPickHistory?.episode ?? 1;

  return (
    <div className="min-h-screen pt-28 pb-28 sm:pb-20 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto">
      {/* ─── Vault Header & Smart Analytics Dashboard ─────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/[0.1]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-magenta-500/15 border border-magenta-500/30 text-magenta-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} />
                SMART PERSONAL VAULT
              </span>
            </div>
            <DualToneHeading
              as="h1"
              text="My Vault"
              className="text-4xl sm:text-5xl font-black tracking-tight"
            />
            <p className="text-white/60 text-sm mt-1">
              Your personalized, AI-organized collection of anime and digital manga.
            </p>
          </div>

          {/* Smart Analytics Dashboard */}
          {list.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Media Breakdown */}
              <div className="px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                  <Tv size={11} className="text-magenta-400" /> Collection
                </p>
                <p className="text-sm font-black text-white mt-0.5">
                  <span className="text-magenta-400">{animeCount}</span> Anime · <span className="text-cyan-400">{mangaCount}</span> Manga
                </p>
              </div>

              {/* Avg Score */}
              {analytics.avgScore && (
                <div className="px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Vault Rating
                  </p>
                  <p className="text-sm font-black text-amber-300 flex items-center gap-1 mt-0.5">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {analytics.avgScore} / 10
                  </p>
                </div>
              )}

              {/* Watch Time or Chapters */}
              {analytics.totalEpisodes > 0 && (
                <div className="px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Est. Watch Time
                  </p>
                  <p className="text-sm font-black text-white mt-0.5">
                    ~{analytics.estimatedHours} Hours ({analytics.totalEpisodes} eps)
                  </p>
                </div>
              )}

              {/* Top Taste Spectrum Genres */}
              {analytics.topGenres.length > 0 && (
                <div className="hidden sm:block px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp size={11} className="text-magenta-400" /> Top Genres
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {analytics.topGenres.map((g) => (
                      <span key={g} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Media Type Separator & Shelf Navigation Capsule ─────────────── */}
        {list.length > 0 && (
          <div className="flex flex-col space-y-4 mt-6">
            {/* Top Media Type Switcher Dock */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <nav className="inline-flex items-center gap-1 bg-black/40 border border-white/[0.08] p-1.5 rounded-full backdrop-blur-2xl shadow-inner shadow-black/50">
                {(
                  [
                    { id: "ALL" as const, label: "All Vault Items", count: allCount, icon: Sparkles },
                    { id: "ANIME" as const, label: "Anime Collection", count: animeCount, icon: Film },
                    { id: "MANGA" as const, label: "Manga & Manhwa", count: mangaCount, icon: BookOpen },
                  ] as const
                ).map((tab) => {
                  const isActive = mediaType === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setMediaType(tab.id)}
                      className={cn(
                        "relative px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 select-none touch-manipulation",
                        isActive ? "text-white font-bold" : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="vault-media-pill"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-magenta-500/30 via-pink-500/25 to-purple-500/30 border border-magenta-500/40 shadow-[0_0_15px_rgba(255,42,133,0.35)]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon size={14} className={isActive ? "text-magenta-400 relative z-10" : "relative z-10"} />
                      <span className="relative z-10">{tab.label}</span>
                      <span
                        className={cn(
                          "relative z-10 text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ml-0.5",
                          isActive ? "bg-magenta-500 text-white shadow-sm" : "bg-white/10 text-white/60"
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Instant Search & Sort Controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search saved titles..."
                    className="w-full pl-9 pr-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-white/40 focus:outline-none focus:border-magenta-500/60 transition-all backdrop-blur-md"
                  />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-black/80 border border-white/[0.08] text-white text-xs rounded-full px-3 py-2 focus:outline-none focus:border-magenta-500/60 cursor-pointer appearance-none pr-8"
                  >
                    <option value="ADDED_DESC">Recently Saved</option>
                    <option value="SCORE_DESC">Highest Rated</option>
                    <option value="TITLE_ASC">Title (A-Z)</option>
                  </select>
                  <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Sub-Shelf Tabs (Dynamic Terminology based on Media Type) */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-1">
              {[
                { id: "ALL" as const, label: "All Shelves" },
                {
                  id: "watching" as const,
                  label: mediaType === "MANGA" ? "Currently Reading" : mediaType === "ANIME" ? "Currently Watching" : "Active Watching/Reading",
                  count: watchingCount,
                },
                {
                  id: "planning" as const,
                  label: mediaType === "MANGA" ? "Plan to Read" : mediaType === "ANIME" ? "Plan to Watch" : "Plan to Watch/Read",
                  count: planningCount,
                },
                { id: "completed" as const, label: "Completed", count: completedCount },
              ].map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap border select-none",
                      isActive
                        ? "bg-white/10 text-white border-white/20 font-bold shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:text-white"
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white/70">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── Smart Pick of the Day Banner ─────────────────────────────────── */}
      {smartPick && list.length > 0 && !filterQuery && (
        <section className="mb-10">
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] bg-black/60 backdrop-blur-2xl p-5 sm:p-7 shadow-xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-magenta-600/10 via-purple-600/10 to-pink-600/10 blur-xl opacity-80 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="relative w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden border border-white/20 shadow-md flex-shrink-0 bg-black/50">
                  <Image
                    src={smartPick.coverImage}
                    alt={smartPick.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-magenta-500/20 text-magenta-300 text-[10px] font-extrabold border border-magenta-500/40">
                    <Flame size={12} className="text-magenta-400 animate-pulse" />
                    SMART PICK FOR TODAY
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight line-clamp-1">
                    {smartPick.title}
                  </h3>
                  <p className="text-xs text-white/50 font-mono">
                    {smartPickIsManga ? "Manga Series" : `Anime · Episode ${smartPickEp}`} · Saved in Vault
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {smartPickIsManga ? (
                <Link
                  href={`/manga/${smartPick.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,42,133,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  <BookOpen size={14} />
                  <span>Start Reading</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  href={`/watch/${smartPick.id}/${smartPickEp}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,42,133,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Play size={14} className="fill-white" />
                  <span>Continue EP {smartPickEp}</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── Content Grid ────────────────────────────────────────────────── */}
      {list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-28 max-w-md mx-auto bg-black/60 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-2xl shadow-2xl"
        >
          <div className="w-20 h-20 rounded-full bg-magenta-500/10 border border-magenta-500/30 text-magenta-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(255,42,133,0.25)]">
            <Bookmark size={36} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Your Vault is Empty</h2>
          <p className="text-white/60 text-sm mb-7 leading-relaxed">
            You haven&apos;t saved any anime or manga yet. Tap the bookmark button on any title to add it to your smart collection.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/search">
              <Button
                size="lg"
                className="rounded-full gap-2 font-bold bg-magenta-500 text-white hover:bg-magenta-400 shadow-[0_0_25px_rgba(255,42,133,0.5)] hover:scale-105 transition-all"
              >
                <Compass size={18} />
                Discover Anime
              </Button>
            </Link>
            <Link href="/manga">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full gap-2 font-bold border-white/20 text-white hover:bg-white/10 transition-all"
              >
                <BookOpen size={18} />
                Explore Manga
              </Button>
            </Link>
          </div>
        </motion.div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-20 bg-black/40 rounded-3xl border border-white/5 p-8 flex flex-col items-center backdrop-blur-xl">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
            <Search size={22} strokeWidth={1.5} />
          </div>
          <p className="text-white font-bold text-base mb-1">No items in this filter</p>
          <p className="text-white/50 text-xs">
            Try choosing a different tab or clearing your search query.
          </p>
        </div>
      ) : (
        /* Vault Grid */
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredList.map((item, i) => {
              const isManga = isMangaItem(item);
              const historyEntry = history.find((h) => h.animeId === item.id);
              const currentEp = historyEntry?.episode ?? 1;
              const progressPct = historyEntry?.progress ? Math.round(historyEntry.progress * 100) : 0;
              const category = item.category || "watching";

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.02, duration: 0.25 }}
                  className="group relative"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-black/70 border border-white/[0.08] hover:border-magenta-500/50 transition-all duration-300 shadow-lg group-hover:-translate-y-1.5 group-hover:shadow-[0_15px_35px_rgba(255,42,133,0.2)]">
                    {/* Poster Cover */}
                    <div className="relative aspect-[2/3] overflow-hidden bg-black/50">
                      <Link href={isManga ? `/manga/${item.id}` : `/anime/${item.id}`} className="block w-full h-full">
                        {item.coverImage ? (
                          <Image
                            src={item.coverImage}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, 20vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {isManga ? <BookOpen size={24} className="text-white/40" /> : <Film size={24} className="text-white/40" />}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                      </Link>

                      {/* Top Badges: Media Type & Score */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                        <span
                          className={cn(
                            "text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md border shadow-sm",
                            isManga
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "bg-magenta-500/20 text-magenta-300 border-magenta-500/40"
                          )}
                        >
                          {isManga ? "MANGA" : "ANIME"}
                        </span>

                        {item.averageScore && (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-amber-300 border border-white/10">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            {(item.averageScore / 10).toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Hover Quick Action */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {isManga ? (
                          <Link
                            href={`/manga/${item.id}`}
                            className="w-11 h-11 rounded-full bg-magenta-500 flex items-center justify-center shadow-[0_0_25px_rgba(255,42,133,0.8)] scale-75 group-hover:scale-100 transition-transform pointer-events-auto"
                          >
                            <BookOpen size={18} className="text-white fill-white" />
                          </Link>
                        ) : (
                          <Link
                            href={`/watch/${item.id}/${currentEp}`}
                            className="w-11 h-11 rounded-full bg-magenta-500 flex items-center justify-center shadow-[0_0_25px_rgba(255,42,133,0.8)] scale-75 group-hover:scale-100 transition-transform pointer-events-auto"
                          >
                            <Play size={18} className="text-white fill-white ml-0.5" />
                          </Link>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemove(item.id, item.title);
                        }}
                        title="Remove from Vault"
                        className="absolute bottom-2.5 right-2.5 z-20 p-2 rounded-full bg-black/80 hover:bg-red-500 text-white/80 hover:text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Episode / Progress bar if watching anime */}
                      {!isManga && historyEntry && (
                        <div className="absolute bottom-0 left-0 right-0 z-10">
                          <div className="px-2.5 py-1 bg-black/90 backdrop-blur-md flex items-center justify-between text-[10px] font-mono font-bold text-white/80 border-t border-white/10">
                            <span className="text-magenta-400">EP {currentEp}</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="h-1 bg-white/20 w-full">
                            <div
                              className="h-full bg-magenta-500 shadow-[0_0_8px_rgba(255,42,133,0.8)]"
                              style={{ width: `${Math.min(progressPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title & 1-Click Shelf Switcher */}
                    <div className="p-3 space-y-2">
                      <Link href={isManga ? `/manga/${item.id}` : `/anime/${item.id}`}>
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-magenta-400 transition-colors">
                          {item.title}
                        </h3>
                      </Link>

                      {/* 1-Click Shelf Status Switcher */}
                      <div className="flex items-center gap-1">
                        <select
                          value={category}
                          onChange={(e) =>
                            handleCategoryChange(
                              item.id,
                              item.title,
                              e.target.value as WatchlistCategory
                            )
                          }
                          className={cn(
                            "w-full text-[10px] font-bold px-2 py-1 rounded-full border appearance-none cursor-pointer focus:outline-none transition-all",
                            category === "watching"
                              ? "bg-magenta-500/20 border-magenta-500/40 text-magenta-300"
                              : category === "planning"
                              ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                              : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          )}
                        >
                          <option value="watching" className="bg-black text-white">
                            {isManga ? "Currently Reading" : "Currently Watching"}
                          </option>
                          <option value="planning" className="bg-black text-white">
                            {isManga ? "Plan to Read" : "Plan to Watch"}
                          </option>
                          <option value="completed" className="bg-black text-white">
                            Completed
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
