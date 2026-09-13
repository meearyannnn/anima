"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Play,
  Bookmark,
  Check,
  Search,
  Star,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { useMyList } from "@/lib/store/useMyList";
import { useToast } from "@/lib/store/useToast";
import { searchAnime, getTrending, getTopAnime } from "@/lib/api/anilist";
import {
  analyzeTasteProfile,
  calculateSmartMatch,
  type TasteProfile,
  type SmartRecommendation,
} from "@/lib/ai/tasteEngine";
import { VIBE_ARCHETYPES, type VibeArchetype } from "@/lib/ai/vibePresets";
import { getAnimeTitle, formatScore, cn } from "@/lib/utils";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import type { AniListMedia } from "@/lib/types";

export function SuggestionsClient() {
  const { history } = useWatchHistory();
  const { list: myList, isInList, addToList, removeFromList } = useMyList();
  const { success, info } = useToast();

  const [prompt, setPrompt] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState<VibeArchetype | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"all" | "tv" | "movie">("all");
  const [mediaList, setMediaList] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingTaste, setAnalyzingTaste] = useState(false);

  const tasteProfile: TasteProfile = useMemo(() => {
    return analyzeTasteProfile(history, myList);
  }, [history, myList]);

  const fetchRecommendations = useCallback(
    async (queryText?: string, archetype?: VibeArchetype | null) => {
      setLoading(true);
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

        setMediaList(results);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const recommendations: SmartRecommendation[] = useMemo(() => {
    if (!mediaList.length) return [];
    let filtered = mediaList;
    if (selectedFormat === "tv") {
      filtered = filtered.filter((m) => m.format === "TV" || m.format === "TV_SHORT");
    } else if (selectedFormat === "movie") {
      filtered = filtered.filter((m) => m.format === "MOVIE");
    }
    return filtered
      .map((anime) => calculateSmartMatch(anime, tasteProfile, prompt, selectedArchetype))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [mediaList, tasteProfile, prompt, selectedArchetype, selectedFormat]);

  const handleSelectArchetype = (arch: VibeArchetype) => {
    if (selectedArchetype?.id === arch.id) {
      setSelectedArchetype(null);
      fetchRecommendations(prompt);
    } else {
      setSelectedArchetype(arch);
      fetchRecommendations(undefined, arch);
    }
  };

  const handleRefreshTaste = () => {
    setAnalyzingTaste(true);
    setTimeout(() => {
      setAnalyzingTaste(false);
      fetchRecommendations();
      success("Taste profile refreshed.");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-kuro-bg text-white pb-28 md:pb-16">
      {/* ── Header ─────────────────────────────────── */}
      <section className="pt-28 pb-10 px-4 sm:px-6 md:px-16 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-magenta-500/10 border border-magenta-500/25 text-magenta-400">
                <Sparkles size={14} />
              </div>
              <span className="text-[11px] font-bold text-magenta-400 uppercase tracking-widest">
                AI Suggestions
              </span>
            </div>
            <DualToneHeading
              as="h1"
              text="Find Your Next Anime"
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            />
            <p className="text-white/50 text-sm mt-2 max-w-md">
              {tasteProfile.personaTitle} — {tasteProfile.personaSummary}
            </p>
          </div>

          <button
            onClick={handleRefreshTaste}
            disabled={analyzingTaste}
            title="Refresh taste profile"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white transition-all touch-target"
          >
            <RefreshCw size={13} className={cn("text-magenta-400", analyzingTaste && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-16 space-y-6">
        {/* ── Search bar ─────────────────────────────── */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (selectedArchetype) setSelectedArchetype(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchRecommendations(prompt);
            }}
            placeholder="Describe a vibe — e.g. 'dark psychological with an anti-hero' …"
            className="w-full pl-11 pr-24 py-3 rounded-xl bg-kuro-card border border-white/[0.08] hover:border-white/15 focus:border-magenta-500/60 focus:ring-2 focus:ring-magenta-500/15 text-sm text-white placeholder:text-white/30 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {prompt && (
              <button
                onClick={() => { setPrompt(""); fetchRecommendations(); }}
                className="p-1.5 text-white/30 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => fetchRecommendations(prompt)}
              className="px-3 py-1.5 rounded-lg bg-magenta-500 hover:bg-magenta-600 text-white text-xs font-semibold transition-all active:scale-95"
            >
              Search
            </button>
          </div>
        </div>

        {/* ── Genre archetype chips ──────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-2.5">
            Or pick a vibe
          </p>
          <div className="flex flex-wrap gap-2">
            {VIBE_ARCHETYPES.map((arch) => {
              const isSelected = selectedArchetype?.id === arch.id;
              const Icon = arch.lucideIcon;
              return (
                <button
                  key={arch.id}
                  onClick={() => handleSelectArchetype(arch)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all touch-manipulation",
                    isSelected
                      ? "bg-magenta-500/15 text-magenta-300 border-magenta-500/40"
                      : "bg-white/[0.03] border-white/[0.07] text-white/55 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <Icon size={13} />
                  <span>{arch.name}</span>
                </button>
              );
            })}
            {selectedArchetype && (
              <button
                onClick={() => { setSelectedArchetype(null); fetchRecommendations(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/[0.07] text-white/40 hover:text-white transition-all"
              >
                <X size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Filters row ────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-white/40">
            <SlidersHorizontal size={13} />
            <span>Filter:</span>
          </div>
          {(["all", "tv", "movie"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFormat(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg border font-medium transition-all",
                selectedFormat === f
                  ? "border-magenta-500/40 bg-magenta-500/10 text-magenta-300"
                  : "border-white/[0.07] bg-white/[0.02] text-white/40 hover:text-white/70"
              )}
            >
              {f === "all" ? "All" : f === "tv" ? "Series" : "Movies"}
            </button>
          ))}
          <span className="text-white/25 ml-auto text-[11px] font-mono">
            {recommendations.length} titles
          </span>
        </div>

        {/* ── Recommendations Grid ─────────────────── */}
        <section className="pb-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-56 rounded-xl bg-kuro-card/50 border border-white/[0.05] animate-pulse"
                />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-20 rounded-xl bg-kuro-card/30 border border-white/[0.05]">
              <Sparkles size={28} className="text-magenta-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white mb-1">No matches found</h4>
              <p className="text-xs text-white/40 max-w-xs mx-auto">
                Try adjusting your filters or typing a different prompt.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec, index) => {
                  const anime = rec.anime;
                  const title = getAnimeTitle(anime.title);
                  const inVault = isInList(anime.id);

                  return (
                    <motion.div
                      key={anime.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ delay: Math.min(0.25, index * 0.04) }}
                      className="group relative rounded-xl bg-kuro-card border border-white/[0.08] hover:border-white/15 p-4 transition-all duration-200 flex flex-col gap-3"
                    >
                      {/* Cover + info */}
                      <div className="flex gap-3 items-start">
                        <Link
                          href={`/anime/${anime.id}`}
                          className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/[0.08] shadow-sm"
                        >
                          {anime.coverImage?.large && (
                            <Image
                              src={anime.coverImage.large}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="72px"
                            />
                          )}
                        </Link>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-magenta-500/15 text-magenta-400 text-[10px] font-mono font-bold">
                              <Sparkles size={9} />
                              {rec.matchScore}%
                            </span>
                            {anime.averageScore && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-white/50 font-medium">
                                <Star size={9} className="fill-white/30 text-white/30" />
                                {formatScore(anime.averageScore)}
                              </span>
                            )}
                          </div>
                          <Link href={`/anime/${anime.id}`} className="block">
                            <h4 className="text-sm font-bold text-white group-hover:text-magenta-300 transition-colors line-clamp-2 leading-snug">
                              {title}
                            </h4>
                          </Link>
                          <p className="text-[10px] text-white/40 font-mono">
                            {anime.format || "TV"} · {anime.episodes ? `${anime.episodes} eps` : "Airing"} · {anime.seasonYear || ""}
                          </p>
                          {anime.studios?.nodes?.[0]?.name && (
                            <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/[0.05] text-white/50">
                              {anime.studios.nodes[0].name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI Rationale */}
                      <p className="text-[11px] text-white/55 leading-relaxed line-clamp-2">
                        {rec.rationale}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06] mt-auto">
                        <Link
                          href={`/watch/${anime.id}/1`}
                          className="flex-1 py-2 px-3 rounded-lg bg-magenta-500 hover:bg-magenta-600 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Play size={12} className="fill-white" />
                          <span>Watch</span>
                        </Link>

                        <button
                          onClick={() => {
                            if (inVault) {
                              removeFromList(anime.id);
                              info(`Removed from Vault`);
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
                              success(`Saved to Vault`);
                            }
                          }}
                          title={inVault ? "In Vault" : "Save to Vault"}
                          className={cn(
                            "p-2 rounded-lg border transition-all",
                            inVault
                              ? "bg-magenta-500/15 text-magenta-400 border-magenta-500/35"
                              : "bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white border-white/[0.08]"
                          )}
                        >
                          {inVault ? <Check size={14} /> : <Bookmark size={14} />}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </section>
      </div>
    </div>
  );
}
