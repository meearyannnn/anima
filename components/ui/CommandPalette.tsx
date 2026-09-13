"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Zap,
  Clock,
  Sparkles,
  Play,
  Film,
  ArrowRight,
  Star,
  X,
  Command,
} from "lucide-react";
import { useCommandPalette } from "@/lib/store/useCommandPalette";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { searchAnime } from "@/lib/api/anilist";
import { getAnimeTitle, formatScore, cn } from "@/lib/utils";
import type { AniListMedia } from "@/lib/types";

interface ParsedQuery {
  title: string;
  episode: number | null;
}

function parseTeleportQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  // Match patterns like: "Demon Slayer 3", "Jujutsu Kaisen 12", "One Piece ep 1015", "Bleach e5"
  const epRegex = /^(.*?)(?:\s+(?:ep(?:isode)?\.?|e)\s*|\s+)(\d+)$/i;
  const match = trimmed.match(epRegex);
  if (match) {
    const title = match[1].trim();
    const episode = parseInt(match[2], 10);
    if (title.length > 0 && !isNaN(episode) && episode > 0) {
      return { title, episode };
    }
  }
  return { title: trimmed, episode: null };
}

const TRENDING_VIBES = [
  "Solo Leveling",
  "Frieren",
  "Jujutsu Kaisen",
  "Demon Slayer",
  "Chainsaw Man",
  "One Piece",
];

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, close, toggle } = useCommandPalette();
  const { history } = useWatchHistory();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggle, close]);

  // Autofocus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const { title: searchTitle, episode: targetEpisode } = parseTeleportQuery(query);

  // Live AniList search with debouncing
  useEffect(() => {
    if (!searchTitle.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAnime({ query: searchTitle.trim(), perPage: 6 });
        setResults(data.Page.media || []);
        setSelectedIndex(0);
      } catch (err) {
        console.warn("Command palette search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTitle]);

  // Recent unique history items
  const recentHistory = history
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
    .slice(0, 4);

  // Total selectable items count for arrow key navigation
  const teleportAvailable = Boolean(targetEpisode && results.length > 0);
  const totalItems = query.trim()
    ? (teleportAvailable ? 1 : 0) + results.length
    : recentHistory.length;

  const handleSelect = useCallback(
    (index: number) => {
      if (query.trim()) {
        if (teleportAvailable && index === 0) {
          // Direct Teleport to Episode
          const target = results[0];
          router.push(`/watch/${target.id}/${targetEpisode}`);
          close();
          return;
        }

        const resultItem = teleportAvailable ? results[index - 1] : results[index];
        if (resultItem) {
          router.push(`/anime/${resultItem.id}`);
          close();
        }
      } else {
        // Jump Back In from History
        const histItem = recentHistory[index];
        if (histItem) {
          router.push(
            `/watch/${histItem.animeId}/${histItem.episode}${
              histItem.season ? `?season=${histItem.season}` : ""
            }`
          );
          close();
        }
      }
    },
    [query, teleportAvailable, results, targetEpisode, router, close, recentHistory]
  );

  // Keyboard navigation inside palette
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalItems > 0) {
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalItems > 0) {
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (totalItems > 0) {
        handleSelect(selectedIndex);
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        close();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-28 px-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl"
          />

          {/* Floating Obsidian Glass Command Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="relative z-10 w-full max-w-2xl bg-kuro-card/95 border border-magenta-500/40 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(255,42,133,0.3)] backdrop-blur-2xl ring-1 ring-white/10"
          >
            {/* ─── Search Input Bar ────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <Search size={20} className="text-magenta-400 flex-shrink-0 stroke-[2.5]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search anime or tele-jump (e.g. 'Demon Slayer 3')..."
                className="flex-1 bg-transparent text-white placeholder-white/40 text-base font-medium focus:outline-none"
              />

              {loading && (
                <div className="w-5 h-5 rounded-full border-2 border-magenta-500 border-t-transparent animate-spin flex-shrink-0" />
              )}

              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-2 py-1 rounded-lg bg-white/10 text-white/70 border border-white/10">
                ESC
              </kbd>
            </div>

            {/* ─── Results & Teleport Body ──────────────────────────────────── */}
            <div className="max-h-[60vh] overflow-y-auto hide-scrollbar p-3 space-y-3">
              {/* ⚡ SMART TELEPORT ACTION BANNER (When title + episode detected) */}
              {teleportAvailable && (
                <div
                  onClick={() => handleSelect(0)}
                  className={cn(
                    "cursor-pointer rounded-2xl p-3.5 border transition-all duration-200 flex items-center justify-between gap-3",
                    selectedIndex === 0
                      ? "bg-magenta-500 text-white border-magenta-500 shadow-[0_0_25px_rgba(255,42,133,0.6)] scale-[1.01]"
                      : "bg-magenta-500/15 border-magenta-500/40 text-white hover:bg-magenta-500/25"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black",
                        selectedIndex === 0
                          ? "bg-white text-black shadow-md"
                          : "bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.6)]"
                      )}
                    >
                      <Zap size={20} className="fill-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-magenta-300">
                          INSTANT TELEPORT
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded font-black bg-white/20 text-white uppercase">
                          EP {targetEpisode}
                        </span>
                      </div>
                      <p className="text-sm font-black truncate text-white">
                        Jump to Episode {targetEpisode} of {getAnimeTitle(results[0].title)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-black px-3 py-1.5 rounded-xl bg-white/15 border border-white/20">
                    <span>Teleport</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              )}

              {/* ─── Search Results List ────────────────────────────────────── */}
              {query.trim() && results.length > 0 && (
                <div className="space-y-1.5">
                  <div className="px-2 pt-1 text-[11px] font-black uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                    <Film size={12} />
                    <span>Matching Anime</span>
                  </div>

                  {results.map((anime, i) => {
                    const itemIndex = (teleportAvailable ? 1 : 0) + i;
                    const isSelected = selectedIndex === itemIndex;
                    const title = getAnimeTitle(anime.title);
                    const cover = anime.coverImage?.large || anime.coverImage?.extraLarge;
                    const score = formatScore(anime.averageScore);

                    return (
                      <div
                        key={anime.id}
                        onClick={() => handleSelect(itemIndex)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={cn(
                          "cursor-pointer rounded-2xl p-2.5 transition-all flex items-center justify-between gap-3 border",
                          isSelected
                            ? "bg-white/[0.08] border-magenta-500/60 shadow-[0_0_15px_rgba(255,42,133,0.25)]"
                            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail */}
                          <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-kuro-surface flex-shrink-0 border border-white/10">
                            {cover ? (
                              <Image src={cover} alt={title} fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20">
                                <Film size={18} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-magenta-400 transition-colors">
                              {title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-white/60">
                              {anime.seasonYear && <span>{anime.seasonYear}</span>}
                              {anime.format && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/80">
                                  {anime.format}
                                </span>
                              )}
                              {anime.episodes && <span>{anime.episodes} eps</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {anime.averageScore && (
                            <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-magenta-500/10 border border-magenta-500/20 text-magenta-400">
                              <Star size={11} className="fill-magenta-400" />
                              <span>{score}</span>
                            </div>
                          )}
                          <div
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              isSelected ? "text-magenta-400" : "text-white/30"
                            )}
                          >
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No results state */}
              {query.trim() && !loading && results.length === 0 && (
                <div className="py-10 text-center text-white/50 space-y-2">
                  <p className="text-sm font-bold text-white">No anime found for &quot;{query}&quot;</p>
                  <p className="text-xs text-white/40">Try searching for a different title or franchise name.</p>
                </div>
              )}

              {/* ─── Empty State: Jump Back In & Trending Vibes ─────────────────── */}
              {!query.trim() && (
                <div className="space-y-4 pt-1">
                  {/* Jump Back In History */}
                  {recentHistory.length > 0 && (
                    <div>
                      <div className="px-2 mb-2 text-[11px] font-black uppercase tracking-wider text-magenta-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Jump Back In</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recentHistory.map((item, i) => {
                          const isSelected = selectedIndex === i;
                          return (
                            <div
                              key={`${item.animeId}-${item.episode}-${i}`}
                              onClick={() => handleSelect(i)}
                              onMouseEnter={() => setSelectedIndex(i)}
                              className={cn(
                                "cursor-pointer rounded-2xl p-2.5 transition-all flex items-center gap-3 border",
                                isSelected
                                  ? "bg-magenta-500/15 border-magenta-500/70 shadow-[0_0_15px_rgba(255,42,133,0.3)]"
                                  : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                              )}
                            >
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-kuro-surface flex-shrink-0">
                                {item.coverImage && (
                                  <Image
                                    src={item.coverImage}
                                    alt={item.animeTitile}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Play size={14} className="fill-white text-white" />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">
                                  {item.animeTitile}
                                </p>
                                <p className="text-[11px] font-medium text-magenta-400">
                                  {item.season ? `S${item.season} • ` : ""}Episode {item.episode}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick AI Suggestions Action */}
                  <div
                    onClick={() => {
                      close();
                      router.push("/search?mode=ai");
                    }}
                    className="cursor-pointer rounded-2xl p-3 bg-gradient-to-r from-magenta-500/15 via-purple-500/10 to-transparent border border-magenta-500/30 hover:border-magenta-500/60 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-magenta-500/20 border border-magenta-500/40 flex items-center justify-center text-magenta-400 group-hover:scale-105 transition-transform">
                        <Sparkles size={16} className="text-magenta-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>Ask KuroAI for Suggestions</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-magenta-500 text-white">
                            NEW
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50">Semantic vibe search & taste genome matching</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-magenta-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Trending Vibes Quick Pills */}
                  <div>
                    <div className="px-2 mb-2 text-[11px] font-black uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-magenta-400" />
                      <span>Trending Searches</span>
                    </div>

                    <div className="flex flex-wrap gap-2 px-1">
                      {TRENDING_VIBES.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setQuery(tag)}
                          className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-magenta-500/20 border border-white/[0.08] hover:border-magenta-500/40 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <span className="text-magenta-400 font-bold">#</span>
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Footer Shortcuts Legend ─────────────────────────────────── */}
            <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40 font-medium">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">↵</kbd>
                  <span>Teleport / Open</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-magenta-400/80">
                <Command size={11} />
                <span>Anima Stream Command HUD</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
