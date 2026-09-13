"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { TrendingRow } from "@/components/anime/TrendingRow";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { useToast } from "@/lib/store/useToast";
import {
  Swords,
  Wand2,
  HeartCrack,
  Laugh,
  Brain,
  Bot,
  Trophy,
  Play,
  Clock,
  ArrowRight,
  Trash2,
  X,
  LayoutGrid,
} from "lucide-react";
import type { AniListMedia } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HomeClientProps {
  trending: AniListMedia[];
  seasonal: AniListMedia[];
  top: AniListMedia[];
}

const VIBES = [
  { id: "all", label: "All", icon: LayoutGrid, genre: null },
  { id: "action", label: "Action", icon: Swords, genre: "Action" },
  { id: "fantasy", label: "Fantasy", icon: Wand2, genre: "Fantasy" },
  { id: "drama", label: "Drama", icon: HeartCrack, genre: "Drama" },
  { id: "comedy", label: "Comedy", icon: Laugh, genre: "Comedy" },
  { id: "mystery", label: "Mystery", icon: Brain, genre: "Mystery" },
  { id: "scifi", label: "Sci-Fi", icon: Bot, genre: "Sci-Fi" },
];

export function HomeClient({ trending, seasonal, top }: HomeClientProps) {
  const { history, removeFromHistory, clearHistory } = useWatchHistory();
  const { info } = useToast();
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState("all");

  // Filter seasonal by selected vibe genre
  const currentGenre = VIBES.find((v) => v.id === selectedVibe)?.genre;
  const filteredSeasonal = currentGenre
    ? seasonal.filter((a) => a.genres?.includes(currentGenre))
    : seasonal;

  return (
    <div className="flex flex-col gap-8 sm:gap-12 pb-28 md:pb-24">

      {/* Continue Watching */}
      {history.length > 0 && (
        <section className="px-4 sm:px-6 md:px-16 max-w-7xl mx-auto w-full pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-magenta-500/10 border border-magenta-500/25 text-magenta-400">
                <Clock size={15} />
              </div>
              <DualToneHeading as="h2" text="Continue Watching" className="text-lg md:text-xl font-bold" />
            </div>

            {/* Clear All History Action */}
            <div>
              {confirmClearHistory ? (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-1 text-xs">
                  <span className="text-red-300 font-medium">Clear all?</span>
                  <button
                    onClick={() => {
                      clearHistory();
                      setConfirmClearHistory(false);
                      info("Watch history cleared");
                    }}
                    className="font-bold text-white bg-red-500 hover:bg-red-400 px-2 py-0.5 rounded-lg transition-all"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClearHistory(false)}
                    className="text-white/50 hover:text-white px-1"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearHistory(true)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all touch-target"
                  title="Clear entire watch history"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3">
            {history
              .filter(
                (item, index, self) =>
                  index ===
                  self.findIndex(
                    (t) =>
                      t.animeId === item.animeId &&
                      (t.season ?? 1) === (item.season ?? 1) &&
                      t.episode === item.episode
                  )
              )
              .slice(0, 8)
              .map((item, index) => (
                <div
                  key={`history-${item.animeId}-s${item.season ?? 1}-e${item.episode}-${index}`}
                  className="flex-shrink-0 w-36 sm:w-48 md:w-56 group relative"
                >
                  <div className="relative rounded-xl overflow-hidden bg-kuro-card border border-white/[0.07] hover:border-magenta-500/50 transition-all duration-300 shadow-md group-hover:-translate-y-1">
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromHistory(item.animeId, item.episode);
                        info(`Removed from history`);
                      }}
                      title="Remove from history"
                      className="absolute top-2 right-2 z-30 p-1.5 rounded-lg bg-black/80 hover:bg-red-500 text-white/70 hover:text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                    >
                      <X size={12} />
                    </button>

                    <Link
                      href={`/watch/${item.animeId}/${item.episode}${item.season ? `?season=${item.season}` : ""}`}
                      className="block"
                    >
                      <div className="relative aspect-video bg-kuro-surface">
                        {item.coverImage && (
                          <Image
                            src={item.coverImage}
                            alt={item.animeTitile}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="224px"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-9 h-9 rounded-full bg-magenta-500 flex items-center justify-center shadow-[0_0_12px_rgba(255,42,133,0.5)]">
                            <Play size={14} className="text-white fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/15">
                          <div
                            className="h-full bg-magenta-500"
                            style={{ width: `${Math.min(item.progress * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-magenta-400 transition-colors">
                          {item.animeTitile}
                        </p>
                        <p className="text-[10px] text-kuro-muted mt-0.5">
                          {item.season ? `S${item.season} · ` : ""}Ep {item.episode}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Trending Now Row */}
      <TrendingRow title="Trending Now" anime={trending.slice(1)} />

      {/* Seasonal — Genre Filter */}
      <section className="px-4 sm:px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-semibold text-magenta-400 uppercase tracking-widest mb-1">
              This Season
            </p>
            <DualToneHeading as="h2" text="Popular Now" className="text-2xl md:text-3xl font-bold" />
          </div>

          {/* Genre filter pills with Lucide icons */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
            {VIBES.map((v) => {
              const isActive = selectedVibe === v.id;
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVibe(v.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border touch-manipulation",
                    isActive
                      ? "bg-magenta-500/15 text-magenta-300 border-magenta-500/40"
                      : "bg-white/[0.03] border-white/[0.07] text-white/55 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <Icon size={13} />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtered Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {(filteredSeasonal.length > 0 ? filteredSeasonal : seasonal).slice(0, 18).map((anime, i) => (
              <AnimeCard key={anime.id} anime={anime} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* All-Time Top Rated */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        className="px-4 sm:px-6 md:px-16 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-magenta-500/10 border border-magenta-500/25 text-magenta-400">
              <Trophy size={16} />
            </div>
            <div>
              <DualToneHeading as="h2" text="Top Rated" className="text-xl md:text-2xl font-bold" />
              <p className="text-[11px] text-kuro-muted">8.5+ community score</p>
            </div>
          </div>

          <Link
            href="/search?sort=SCORE_DESC"
            className="flex items-center gap-1 text-xs font-semibold text-magenta-400 hover:text-magenta-300 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {top.slice(0, 12).map((anime, i) => (
            <AnimeCard key={anime.id} anime={anime} rank={i + 1} index={i} />
          ))}
        </div>
      </motion.section>
    </div>
  );
}
