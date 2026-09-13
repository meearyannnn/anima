"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { TrendingRow } from "@/components/anime/TrendingRow";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { useToast } from "@/lib/store/useToast";
import {
  Flame,
  Sparkles,
  Trophy,
  Play,
  Clock,
  ArrowRight,
  Compass,
  Trash2,
  X,
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
  { id: "all", label: "All Vibes", emoji: "✨", genre: null },
  { id: "action", label: "Hype & OP", emoji: "⚡", genre: "Action" },
  { id: "fantasy", label: "Isekai & Fantasy", emoji: "🌌", genre: "Fantasy" },
  { id: "drama", label: "Emotional Damage", emoji: "💔", genre: "Drama" },
  { id: "comedy", label: "Pure Laughs", emoji: "😂", genre: "Comedy" },
  { id: "mystery", label: "Big Brain", emoji: "🧠", genre: "Mystery" },
  { id: "scifi", label: "Cyber & Sci-Fi", emoji: "🤖", genre: "Sci-Fi" },
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
      {/* Gen-Z Live Animated Marquee Ticker */}
      <div className="relative overflow-hidden bg-gradient-to-r from-magenta-500/5 via-kuro-card to-magenta-500/5 border-y border-white/[0.08] py-3 select-none backdrop-blur-md">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs font-black tracking-wider uppercase text-white/90">
          <span className="text-magenta-400">✦ LIVE AIRING SEASON ✦</span>
          <span className="text-white font-extrabold">NO ADS • PURE STREAMING</span>
          <span className="text-magenta-400">✦ VIDROCK MULTI-MIRROR ENGINE ✦</span>
          <span className="text-white">1080P ULTRA HD</span>
          <span className="text-magenta-400">✦ SUB & DUB INSTANT TOGGLES ✦</span>
          <span className="text-white">ANILIST SYNCED VAULT</span>
          <span className="text-magenta-400">✦ INSTANT ANIME DISCOVERY ✦</span>
          <span className="text-white font-extrabold">NO ADS • PURE STREAMING</span>
          <span className="text-magenta-400">✦ VIDROCK MULTI-MIRROR ENGINE ✦</span>
          <span className="text-white">1080P ULTRA HD</span>
          <span className="text-magenta-400">✦ SUB & DUB INSTANT TOGGLES ✦</span>
        </div>
      </div>

      {/* Continue Watching (Instant Resume) */}
      {history.length > 0 && (
        <section className="px-4 sm:px-6 md:px-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-magenta-500/10 border border-magenta-500/30 text-magenta-400">
                <Clock size={16} />
              </div>
              <DualToneHeading as="h2" text="Jump Back In" className="text-lg md:text-xl font-black" />
            </div>

            {/* Clear All History Action */}
            <div>
              {confirmClearHistory ? (
                <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-1 text-xs">
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
                    className="text-white/60 hover:text-white px-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearHistory(true)}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white px-2.5 py-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                  title="Clear entire watch history"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Clear History</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3">
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
                  className="flex-shrink-0 w-40 sm:w-52 md:w-60 group relative"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-kuro-card/90 border border-white/[0.08] hover:border-magenta-500/70 transition-all duration-300 shadow-lg group-hover:-translate-y-1">
                    {/* 1-Click Remove button on hover */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromHistory(item.animeId, item.episode);
                        info(`Removed "${item.animeTitile}" from history`);
                      }}
                      title="Remove from history"
                      className="absolute top-2 right-2 z-30 p-1.5 rounded-xl bg-black/80 hover:bg-red-500 text-white/80 hover:text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-md"
                    >
                      <X size={13} />
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
                            sizes="240px"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                        {/* Play pill */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-magenta-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,42,133,0.6)]">
                            <Play size={16} className="text-white fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                          <div
                            className="h-full bg-magenta-500 shadow-[0_0_8px_rgba(255,42,133,0.8)]"
                            style={{ width: `${Math.min(item.progress * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="text-xs font-bold text-white truncate group-hover:text-magenta-400 transition-colors">
                          {item.animeTitile}
                        </p>
                        <p className="text-[11px] font-semibold text-kuro-muted mt-0.5">
                          {item.season ? `S${item.season} · ` : ""}Episode {item.episode}
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
      <TrendingRow title="🔥 Trending Right Now" anime={trending.slice(1)} />

      {/* Interactive "Choose Your Vibe" Section */}
      <section className="px-4 sm:px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-magenta-400 font-black text-xs uppercase tracking-widest">
                Curated Selection
              </span>
            </div>
            <DualToneHeading as="h2" text="Popular This Season" className="text-2xl md:text-3xl font-black" />
          </div>

          {/* Vibe Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
            {VIBES.map((v) => {
              const isActive = selectedVibe === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVibe(v.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border",
                    isActive
                      ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-[0_0_15px_rgba(255,42,133,0.45)]"
                      : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08]"
                  )}
                >
                  <span>{v.emoji}</span>
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Filtered Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          <AnimatePresence mode="popLayout">
            {(filteredSeasonal.length > 0 ? filteredSeasonal : seasonal).slice(0, 18).map((anime, i) => (
              <AnimeCard key={anime.id} anime={anime} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* All-Time GOATs / Top Rated */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        className="px-6 md:px-16 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-magenta-500/10 border border-magenta-500/30 text-magenta-400">
              <Trophy size={20} />
            </div>
            <div>
              <DualToneHeading as="h2" text="Top Rated GOATs" className="text-xl md:text-2xl font-black" />
              <p className="text-xs text-kuro-muted">Masterpieces with 8.5+ community score</p>
            </div>
          </div>

          <Link
            href="/search?sort=SCORE_DESC"
            className="flex items-center gap-1 text-xs font-bold text-magenta-400 hover:text-magenta-300 transition-colors group"
          >
            <span>Explore All</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {top.slice(0, 12).map((anime, i) => (
            <AnimeCard key={anime.id} anime={anime} rank={i + 1} index={i} />
          ))}
        </div>
      </motion.section>
    </div>
  );
}
