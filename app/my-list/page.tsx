"use client";

import { useState } from "react";
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
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useMyList } from "@/lib/store/useMyList";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { useToast } from "@/lib/store/useToast";
import { Button } from "@/components/ui/Button";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { cn } from "@/lib/utils";
import type { WatchlistCategory } from "@/lib/types";

type CategoryFilter = "ALL" | WatchlistCategory;

export default function MyListPage() {
  const { list, removeFromList, updateCategory } = useMyList();
  const { history } = useWatchHistory();
  const { info, success } = useToast();

  const [filterQuery, setFilterQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");

  const handleRemove = (id: number, title: string) => {
    removeFromList(id);
    info(`Removed "${title}" from your vault`);
  };

  const handleCategoryChange = (id: number, title: string, category: WatchlistCategory) => {
    updateCategory(id, category);
    const categoryLabels: Record<WatchlistCategory, string> = {
      watching: "Watching",
      planning: "Plan to Watch",
      completed: "Completed",
    };
    success(`Moved "${title}" to ${categoryLabels[category]}`);
  };

  // Counts per category
  const allCount = list.length;
  const watchingCount = list.filter((i) => (i.category || "watching") === "watching").length;
  const planningCount = list.filter((i) => i.category === "planning").length;
  const completedCount = list.filter((i) => i.category === "completed").length;

  // Filter list by query and category
  const filteredList = list.filter((item) => {
    const matchesQuery = item.title.toLowerCase().includes(filterQuery.toLowerCase());
    const itemCategory = item.category || "watching";
    const matchesCategory = activeCategory === "ALL" ? true : itemCategory === activeCategory;
    return matchesQuery && matchesCategory;
  });

  // Calculate vault stats
  const totalEpisodes = list.reduce((acc, curr) => acc + (curr.episodes || 0), 0);
  const scoredItems = list.filter((i) => i.averageScore);
  const avgScore =
    scoredItems.length > 0
      ? (
          scoredItems.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) /
          scoredItems.length /
          10
        ).toFixed(1)
      : null;

  return (
    <div className="min-h-screen pt-28 pb-28 sm:pb-20 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto">
      {/* ─── Vault Header & Stats Dashboard ────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-magenta-500/15 border border-magenta-500/30 text-magenta-400 text-xs font-black uppercase tracking-wider">
                PERSONAL LIBRARY
              </span>
            </div>
            <DualToneHeading
              as="h1"
              text="My Vault"
              className="text-4xl sm:text-5xl font-black tracking-tight"
            />
            <p className="text-kuro-muted text-sm mt-1">
              Your handpicked anime collection organized into personal shelves.
            </p>
          </div>

          {/* Quick Stats Dashboard */}
          {list.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                <p className="text-[10px] font-bold text-kuro-muted uppercase tracking-wider">
                  Saved Titles
                </p>
                <p className="text-xl font-black text-white">{list.length}</p>
              </div>

              {avgScore && (
                <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <p className="text-[10px] font-bold text-kuro-muted uppercase tracking-wider">
                    Avg Rating
                  </p>
                  <p className="text-xl font-black text-magenta-400 flex items-center gap-1.5">
                    <Star size={16} className="fill-magenta-400 text-magenta-400" />
                    {avgScore}
                  </p>
                </div>
              )}

              {totalEpisodes > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <p className="text-[10px] font-bold text-kuro-muted uppercase tracking-wider">
                    Total Episodes
                  </p>
                  <p className="text-xl font-black text-white">{totalEpisodes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Categorization Tabs & Search Bar ────────────────────────── */}
        {list.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
            {/* 4 Category Shelves */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
              {[
                { id: "ALL" as const, label: "All Titles", count: allCount },
                { id: "watching" as const, label: "Watching", count: watchingCount },
                { id: "planning" as const, label: "Plan to Watch", count: planningCount },
                { id: "completed" as const, label: "Completed", count: completedCount },
              ].map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border",
                      isActive
                        ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-[0_0_15px_rgba(255,42,133,0.45)]"
                        : "bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                        isActive ? "bg-black/25 text-white" : "bg-white/10 text-white/60"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search filter within vault */}
            <div className="relative w-full md:w-64 flex-shrink-0">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kuro-muted"
              />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search saved titles..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-kuro-muted focus:outline-none focus:border-magenta-500"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── Content Grid ────────────────────────────────────────────── */}
      {list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-28 max-w-md mx-auto bg-kuro-surface/50 border border-white/[0.06] rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-magenta-500/10 border border-magenta-500/30 text-magenta-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(255,42,133,0.25)]">
            <Bookmark size={36} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Your Vault is Empty</h2>
          <p className="text-kuro-text-dim text-sm mb-7 leading-relaxed">
            You haven&apos;t bookmarked any anime yet. Tap the bookmark icon on any anime card to
            save it for later.
          </p>
          <Link href="/search">
            <Button
              size="lg"
              className="rounded-2xl gap-2 font-bold bg-magenta-500 text-white hover:bg-magenta-400 shadow-[0_0_25px_rgba(255,42,133,0.5)] hover:scale-105 transition-all"
            >
              <Compass size={18} />
              Discover Anime
            </Button>
          </Link>
        </motion.div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-20 bg-kuro-surface/30 rounded-3xl border border-white/5 p-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-kuro-muted mb-3">
            <Search size={22} strokeWidth={1.5} />
          </div>
          <p className="text-white font-bold text-base mb-1">No anime in this shelf</p>
          <p className="text-kuro-muted text-xs">
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
              // Check if user has history for this anime
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
                  <div className="relative rounded-2xl overflow-hidden bg-kuro-card/85 border border-white/[0.08] hover:border-magenta-500/70 transition-all duration-300 shadow-lg group-hover:-translate-y-1.5 group-hover:shadow-[0_15px_35px_rgba(255,42,133,0.25)]">
                    {/* Aspect cover */}
                    <div className="relative aspect-[2/3] overflow-hidden bg-kuro-surface">
                      <Link href={`/anime/${item.id}`} className="block w-full h-full">
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
                            <Film size={24} className="text-kuro-muted" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                      </Link>

                      {/* Rating badge */}
                      {item.averageScore && (
                        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg px-2 py-0.5">
                          <Star size={10} className="text-magenta-400 fill-magenta-400" />
                          <span className="text-[11px] font-black text-white">
                            {(item.averageScore / 10).toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Quick play action */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Link
                          href={`/watch/${item.id}/${currentEp}`}
                          className="w-12 h-12 rounded-full bg-magenta-500 flex items-center justify-center shadow-[0_0_25px_rgba(255,42,133,0.8)] scale-75 group-hover:scale-100 transition-transform pointer-events-auto"
                        >
                          <Play size={18} className="text-white fill-white ml-0.5" />
                        </Link>
                      </div>

                      {/* Delete button top right */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemove(item.id, item.title);
                        }}
                        title="Remove from Vault"
                        className="absolute top-2.5 right-2.5 z-20 p-2 rounded-xl bg-black/75 hover:bg-red-500 text-white/80 hover:text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Episode / Progress bar if watching */}
                      {historyEntry && (
                        <div className="absolute bottom-0 left-0 right-0 z-10">
                          <div className="px-2.5 py-1 bg-black/85 backdrop-blur-md flex items-center justify-between text-[10px] font-mono font-bold text-white/80 border-t border-white/10">
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

                    {/* Title & 1-Click Shelf Category Switcher */}
                    <div className="p-3 space-y-2">
                      <Link href={`/anime/${item.id}`}>
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
                            "w-full text-[10px] font-bold px-2 py-1 rounded-lg border appearance-none cursor-pointer focus:outline-none transition-all",
                            category === "watching"
                              ? "bg-magenta-500/15 border-magenta-500/40 text-magenta-300"
                              : category === "planning"
                              ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                              : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          )}
                        >
                          <option value="watching" className="bg-black text-white">
                            Watching
                          </option>
                          <option value="planning" className="bg-black text-white">
                            Plan to Watch
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
