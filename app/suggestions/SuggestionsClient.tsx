"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Search,
  Dna,
  RefreshCw,
  Play,
  Bookmark,
  Check,
  Flame,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Dice5,
  X,
  Star,
  Activity,
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

  // Active Mode: 'vibe' | 'genome' | 'gacha'
  const [activeMode, setActiveMode] = useState<"vibe" | "genome" | "gacha">("vibe");

  // Vibe Search state
  const [prompt, setPrompt] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState<VibeArchetype | null>(null);

  // Filters
  const [selectedPacing, setSelectedPacing] = useState<"all" | "fast" | "slow">("all");
  const [selectedFormat, setSelectedFormat] = useState<"all" | "tv" | "movie">("all");

  // Recommendation State
  const [mediaList, setMediaList] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingTaste, setAnalyzingTaste] = useState(false);

  // Gacha Roulette State
  const [isSpinningGacha, setIsSpinningGacha] = useState(false);
  const [gachaWinner, setGachaWinner] = useState<SmartRecommendation | null>(null);

  // 1. Analyze Taste Profile
  const tasteProfile: TasteProfile = useMemo(() => {
    return analyzeTasteProfile(history, myList);
  }, [history, myList]);

  // Initial Load & Query Engine
  const fetchRecommendations = useCallback(
    async (queryText?: string, archetype?: VibeArchetype | null) => {
      setLoading(true);
      try {
        let results: AniListMedia[] = [];

        if (archetype) {
          // Query targeted by archetype genres & query keywords
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
          // Default: Top & Trending blend for Taste Genome matching
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
        console.error("Failed to fetch smart suggestions:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Transform media into scored & ranked Smart Recommendations
  const recommendations: SmartRecommendation[] = useMemo(() => {
    if (!mediaList.length) return [];

    let filtered = mediaList;

    // Apply Format Filter
    if (selectedFormat === "tv") {
      filtered = filtered.filter((m) => m.format === "TV" || m.format === "TV_SHORT");
    } else if (selectedFormat === "movie") {
      filtered = filtered.filter((m) => m.format === "MOVIE");
    }

    // Apply Pacing Filter
    if (selectedPacing === "fast") {
      filtered = filtered.filter((m) => (m.episodes ?? 12) <= 16);
    } else if (selectedPacing === "slow") {
      filtered = filtered.filter((m) => (m.episodes ?? 24) > 16);
    }

    return filtered
      .map((anime) => calculateSmartMatch(anime, tasteProfile, prompt, selectedArchetype))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [mediaList, tasteProfile, prompt, selectedArchetype, selectedFormat, selectedPacing]);

  // Handle Preset Selection
  const handleSelectArchetype = (arch: VibeArchetype) => {
    if (selectedArchetype?.id === arch.id) {
      setSelectedArchetype(null);
      fetchRecommendations(prompt);
    } else {
      setSelectedArchetype(arch);
      fetchRecommendations(undefined, arch);
    }
  };

  // Trigger Taste Genome Re-Scan
  const handleRefreshTaste = () => {
    setAnalyzingTaste(true);
    setTimeout(() => {
      setAnalyzingTaste(false);
      fetchRecommendations();
      success("Taste Genome Updated: Recalculated affinities from recent watch history.");
    }, 600);
  };

  // Cyber Gacha Spin Action
  const handleSpinGacha = () => {
    if (!recommendations.length || isSpinningGacha) return;
    setIsSpinningGacha(true);
    setGachaWinner(null);

    let counter = 0;
    const interval = setInterval(() => {
      const rand = recommendations[Math.floor(Math.random() * recommendations.length)];
      setGachaWinner(rand);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setIsSpinningGacha(false);
      }
    }, 120);
  };

  return (
    <div className="min-h-screen bg-kuro-bg text-white pb-28 sm:pb-24">
      {/* ─── Hero Header & AI Core Visualizer ───────────────────────────────── */}
      <section className="relative pt-28 pb-12 px-4 sm:px-6 lg:px-12 overflow-hidden border-b border-white/[0.06]">
        {/* Background glow effects */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-magenta-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-magenta-500/10 border border-magenta-500/30 text-magenta-400 text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(255,42,133,0.3)]"
          >
            <Sparkles size={14} className="animate-spin text-magenta-400" />
            <span>KuroAI Neural Oracle • Smart Match</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DualToneHeading
              as="h1"
              text="Intelligent Anime Suggestions"
              className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/70 max-w-2xl mx-auto text-sm sm:text-base"
          >
            Powered by real-time taste genome analysis and semantic vibe matching. Describe what you want or let KuroAI decipher your watching DNA.
          </motion.p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 mt-8 space-y-8">
        {/* ─── 🧬 Taste Genome Radar Card ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl bg-gradient-to-r from-kuro-card via-[#13131d] to-kuro-card border border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-xl overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-magenta-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-magenta-500/20 text-magenta-400 border border-magenta-500/30">
                  <Dna size={16} />
                </span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white/50">
                  Taste Genome Profile
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                {tasteProfile.personaTitle}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl">
                {tasteProfile.personaSummary}
              </p>
            </div>

            {/* Quick Metrics & Re-analyze button */}
            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <div className="text-center sm:text-left">
                <div className="text-xs text-white/50 font-mono">Engagement</div>
                <div className="text-base sm:text-lg font-black text-magenta-400">
                  {tasteProfile.totalWatched} eps • {tasteProfile.totalSaved} saved
                </div>
              </div>

              <button
                onClick={handleRefreshTaste}
                disabled={analyzingTaste}
                title="Re-analyze Taste Profile"
                className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-magenta-500/40 text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RefreshCw size={13} className={cn(analyzingTaste && "animate-spin text-magenta-400")} />
                <span className="hidden sm:inline">Sync DNA</span>
              </button>
            </div>
          </div>

          {/* Genre affinity bar breakdown */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-5 gap-3">
            {tasteProfile.topGenres.map((g) => (
              <div key={g.genre} className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-white/80 mb-1.5">
                  <span className="truncate">{g.genre}</span>
                  <span className="text-magenta-400 font-mono font-bold">{g.percentage}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-magenta-500 to-pink-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(10, g.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Mode Selector Tabs ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setActiveMode("vibe")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeMode === "vibe"
                  ? "bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                  : "text-white/70 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Zap size={14} />
              <span>Vibe Oracle</span>
            </button>

            <button
              onClick={() => {
                setActiveMode("genome");
                setSelectedArchetype(null);
                setPrompt("");
                fetchRecommendations();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeMode === "genome"
                  ? "bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                  : "text-white/70 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Dna size={14} />
              <span>Taste Genome Feed</span>
            </button>

            <button
              onClick={() => {
                setActiveMode("gacha");
                if (!gachaWinner && recommendations.length > 0) {
                  setGachaWinner(recommendations[0]);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeMode === "gacha"
                  ? "bg-magenta-500 text-white shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                  : "text-white/70 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Dice5 size={14} />
              <span>Cyber Gacha</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="bg-kuro-card border border-white/10 rounded-xl px-3 py-1.5 text-white/90 text-xs font-semibold focus:outline-none focus:border-magenta-500"
            >
              <option value="all">All Formats</option>
              <option value="tv">TV Series</option>
              <option value="movie">Movies</option>
            </select>

            <select
              value={selectedPacing}
              onChange={(e) => setSelectedPacing(e.target.value as any)}
              className="bg-kuro-card border border-white/10 rounded-xl px-3 py-1.5 text-white/90 text-xs font-semibold focus:outline-none focus:border-magenta-500"
            >
              <option value="all">All Pacing</option>
              <option value="fast">Fast Binge (≤13 eps)</option>
              <option value="slow">Epic Sagas (&gt;13 eps)</option>
            </select>
          </div>
        </div>

        {/* ─── Mode 1: Vibe Oracle (Prompt + Archetypes) ──────────────────────── */}
        {activeMode === "vibe" && (
          <div className="space-y-6">
            {/* Natural Language Prompt Search Bar */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-4 text-magenta-400" />
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
                  placeholder="Describe your vibe (e.g. 'dark psychological mind games with an anti-hero' or 'cozy anime with beautiful food') ..."
                  className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-kuro-card/90 border border-white/10 hover:border-magenta-500/40 focus:border-magenta-500 focus:outline-none focus:ring-2 focus:ring-magenta-500/20 text-sm font-medium text-white placeholder:text-white/40 shadow-xl transition-all"
                />
                {prompt && (
                  <button
                    onClick={() => {
                      setPrompt("");
                      fetchRecommendations();
                    }}
                    className="absolute right-20 text-white/40 hover:text-white p-1"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  onClick={() => fetchRecommendations(prompt)}
                  className="absolute right-2.5 px-4 py-2 rounded-xl bg-magenta-500 hover:bg-magenta-600 text-white text-xs font-bold shadow-[0_0_12px_rgba(255,42,133,0.5)] transition-all active:scale-95"
                >
                  Ask AI
                </button>
              </div>
            </div>

            {/* Curated Vibe Archetype Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white/50 uppercase tracking-wider">
                <span>Or Select an AI Vibe Archetype</span>
                {selectedArchetype && (
                  <button
                    onClick={() => {
                      setSelectedArchetype(null);
                      fetchRecommendations();
                    }}
                    className="text-magenta-400 hover:underline capitalize font-semibold"
                  >
                    Clear Archetype
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {VIBE_ARCHETYPES.map((arch) => {
                  const isSelected = selectedArchetype?.id === arch.id;
                  return (
                    <button
                      key={arch.id}
                      onClick={() => handleSelectArchetype(arch)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative overflow-hidden group",
                        isSelected
                          ? "bg-magenta-500/15 border-magenta-500 shadow-[0_0_15px_rgba(255,42,133,0.3)]"
                          : "bg-kuro-card/70 border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{arch.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className={cn("text-xs font-bold truncate", isSelected ? "text-magenta-400" : "text-white")}>
                            {arch.name}
                          </h4>
                          <p className="text-[10px] text-white/50 truncate mt-0.5">
                            {arch.tagline}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Mode 3: Cyber Gacha Roulette ──────────────────────────────────── */}
        {activeMode === "gacha" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-gradient-to-b from-[#13131c] to-kuro-card border border-magenta-500/30 p-6 sm:p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(255,42,133,0.15)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-magenta-500/20 blur-3xl pointer-events-none" />

            <div className="max-w-xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-magenta-500/20 text-magenta-400 text-xs font-mono font-bold tracking-wider uppercase border border-magenta-500/30">
                <Dice5 size={13} />
                Smart Anime Roulette
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Can't Decide? Let KuroAI Roll for You
              </h3>
              <p className="text-xs sm:text-sm text-white/70">
                Spins through high-compatibility candidates tailored to your taste profile.
              </p>

              {/* Gacha Display Card */}
              {gachaWinner && (
                <motion.div
                  key={gachaWinner.anime.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-6 p-4 rounded-2xl bg-black/50 border border-white/15 flex flex-col sm:flex-row items-center gap-5 text-left transition-all",
                    isSpinningGacha && "blur-[2px] opacity-75 scale-98"
                  )}
                >
                  <div className="relative w-28 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-kuro-card border border-white/10 shadow-lg">
                    {gachaWinner.anime.coverImage?.large && (
                      <Image
                        src={gachaWinner.anime.coverImage.large}
                        alt={getAnimeTitle(gachaWinner.anime.title)}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-magenta-500/20 border border-magenta-500/40 text-magenta-400 text-[11px] font-bold">
                        ★ {gachaWinner.matchScore}% Match
                      </span>
                      <span className="text-xs text-white/50 font-mono">
                        {gachaWinner.anime.format} • {gachaWinner.anime.episodes ?? "?"} eps
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-white truncate">
                      {getAnimeTitle(gachaWinner.anime.title)}
                    </h4>

                    <p className="text-xs text-white/70 line-clamp-2">
                      {gachaWinner.rationale}
                    </p>

                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        href={`/watch/${gachaWinner.anime.id}/1`}
                        className="px-4 py-2 rounded-xl bg-magenta-500 hover:bg-magenta-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,42,133,0.5)] transition-all"
                      >
                        <Play size={13} className="fill-white" />
                        <span>Watch Episode 1</span>
                      </Link>
                      <Link
                        href={`/anime/${gachaWinner.anime.id}`}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Spin Button */}
              <div className="pt-4">
                <button
                  onClick={handleSpinGacha}
                  disabled={isSpinningGacha}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-magenta-500 to-pink-500 hover:from-magenta-600 hover:to-pink-600 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 mx-auto shadow-[0_0_25px_rgba(255,42,133,0.6)] active:scale-95 transition-all"
                >
                  <Dice5 size={18} className={cn(isSpinningGacha && "animate-spin")} />
                  <span>{isSpinningGacha ? "Deciphering Fates..." : "Spin KuroAI Roulette"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Recommendations Grid ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Activity size={18} className="text-magenta-400" />
              <span>
                {selectedArchetype
                  ? `Curated for "${selectedArchetype.name}"`
                  : activeMode === "genome"
                  ? "Tailored from Your Taste DNA"
                  : prompt
                  ? `AI Matches for "${prompt}"`
                  : "High-Affinity Recommendations"}
              </span>
            </h3>
            <span className="text-xs text-white/50 font-mono">
              {recommendations.length} titles evaluated
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="h-64 rounded-2xl bg-kuro-card/50 border border-white/5 animate-pulse p-4 space-y-3" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-kuro-card/40 border border-white/5 space-y-3">
              <Sparkles size={32} className="text-magenta-400 mx-auto" />
              <h4 className="text-base font-bold text-white">No Direct Matches Found</h4>
              <p className="text-xs text-white/60 max-w-sm mx-auto">
                Try loosening your filters or typing a different mood prompt into the Vibe Oracle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((rec, index) => {
                const anime = rec.anime;
                const title = getAnimeTitle(anime.title);
                const inVault = isInList(anime.id);

                return (
                  <motion.div
                    key={anime.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(0.3, index * 0.05) }}
                    className="group relative rounded-2xl bg-kuro-card border border-white/10 hover:border-magenta-500/50 p-4 transition-all duration-300 shadow-xl flex flex-col justify-between overflow-hidden"
                  >
                    {/* Top Glow Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-magenta-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Match Score & Vibe Tags */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-magenta-500/15 border border-magenta-500/40 text-magenta-400 font-mono font-black text-xs shadow-[0_0_10px_rgba(255,42,133,0.3)]">
                          <Flame size={12} className="fill-magenta-400" />
                          {rec.matchScore}% AI Match
                        </span>

                        <div className="flex items-center gap-1 overflow-hidden">
                          {rec.vibeTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.05] text-white/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Cover & Title Block */}
                      <div className="flex gap-3.5 items-start">
                        <Link
                          href={`/anime/${anime.id}`}
                          className="relative w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/10 shadow-md group-hover:scale-105 transition-transform"
                        >
                          {anime.coverImage?.large && (
                            <Image
                              src={anime.coverImage.large}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="100px"
                            />
                          )}
                        </Link>

                        <div className="min-w-0 flex-1 space-y-1">
                          <Link href={`/anime/${anime.id}`} className="block">
                            <h4 className="text-sm font-black text-white group-hover:text-magenta-400 transition-colors line-clamp-1">
                              {title}
                            </h4>
                          </Link>

                          <p className="text-[11px] text-white/50 font-mono">
                            {anime.format || "TV"} • {anime.episodes ? `${anime.episodes} eps` : "Airing"} • {anime.seasonYear || ""}
                          </p>

                          {anime.studios?.nodes?.[0]?.name && (
                            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-magenta-300">
                              {anime.studios.nodes[0].name}
                            </span>
                          )}

                          {anime.averageScore && (
                            <div className="flex items-center gap-1 text-xs text-white/80 font-bold pt-1">
                              <Star size={12} className="fill-magenta-400 text-magenta-400" />
                              <span>{formatScore(anime.averageScore)}% score</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Rationale Badge */}
                      <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/80 leading-relaxed">
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-magenta-400 mb-1">
                          <Sparkles size={11} />
                          <span>Why KuroAI Picked This</span>
                        </div>
                        <p className="text-white/70">{rec.rationale}</p>
                      </div>

                      {/* Match Breakdown Metric Bars */}
                      <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.05] text-[10px]">
                        <div>
                          <span className="text-white/40 block">Animation</span>
                          <span className="font-mono font-bold text-white">{rec.breakdown.animation}%</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Story Depth</span>
                          <span className="font-mono font-bold text-white">{rec.breakdown.story}%</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Hype Index</span>
                          <span className="font-mono font-bold text-white">{rec.breakdown.hype}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center gap-2">
                      <Link
                        href={`/watch/${anime.id}/1`}
                        className="flex-1 py-2 px-3 rounded-xl bg-magenta-500 hover:bg-magenta-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(255,42,133,0.35)]"
                      >
                        <Play size={12} className="fill-white" />
                        <span>Stream S1E1</span>
                      </Link>

                      <button
                        onClick={() => {
                          if (inVault) {
                            removeFromList(anime.id);
                            info(`Removed ${title} from Vault`);
                          } else {
                            addToList({
                              id: anime.id,
                              title: title,
                              coverImage: anime.coverImage?.large ?? "",
                              genres: anime.genres || [],
                              averageScore: anime.averageScore,
                              episodes: anime.episodes,
                              status: anime.status || "FINISHED",
                              category: "planning",
                            });
                            success(`Saved ${title} to Vault`);
                          }
                        }}
                        title={inVault ? "In Vault" : "Save to Vault"}
                        className={cn(
                          "p-2 rounded-xl border transition-all text-xs",
                          inVault
                            ? "bg-magenta-500/20 text-magenta-400 border-magenta-500/40"
                            : "bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white border-white/10"
                        )}
                      >
                        {inVault ? <Check size={15} /> : <Bookmark size={15} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
