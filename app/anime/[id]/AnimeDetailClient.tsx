"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Plus,
  Check,
  Star,
  Calendar,
  Film,
  ChevronDown,
  ChevronUp,
  Tv,
  ThumbsUp,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
  Info,
  Clock,
  BookOpen,
  Zap,
  List,
  LayoutGrid,
  Hash,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { useMyList } from "@/lib/store/useMyList";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { useToast } from "@/lib/store/useToast";
import { useMoodRing } from "@/lib/store/useMoodRing";
import { getAnimeTitle, formatScore, stripHtml } from "@/lib/utils";
import {
  resolveStreamIds,
  getTmdbTvDetails,
  getTmdbSeasonEpisodes,
  type TmdbEpisode,
  type TmdbSeason,
  type StreamIds,
} from "@/lib/api/tmdb";
import type { AniListMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  anime: AniListMedia;
}

export function AnimeDetailClient({ anime }: Props) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<TmdbSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [tmdbEpisodes, setTmdbEpisodes] = useState<TmdbEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [episodeViewMode, setEpisodeViewMode] = useState<"row" | "grid" | "pills">("row");
  const [episodeFilter, setEpisodeFilter] = useState("");

  const [mounted, setMounted] = useState(false);
  const { isInList, addToList, removeFromList } = useMyList();
  const { getProgress } = useWatchHistory();
  const { success, info } = useToast();
  const { setMoodFromGenres } = useMoodRing();

  const title = getAnimeTitle(anime.title);

  useEffect(() => {
    setMounted(true);
    setMoodFromGenres(anime.genres, title);
  }, [anime.genres, title, setMoodFromGenres]);
  const inList = mounted && isInList(anime.id);
  const isMovie = anime.format === "MOVIE";
  const synopsis = anime.description ? stripHtml(anime.description) : "No synopsis available.";
  const shortSynopsis = synopsis.slice(0, 320);
  const needsExpand = synopsis.length > 320;

  // Available seasons from TMDB or fallbacks
  const availableSeasons: { season_number: number; name: string; episode_count?: number }[] =
    seasons.length > 0
      ? seasons.map((s) => ({
          season_number: s.season_number,
          name: s.name || `Season ${s.season_number}`,
          episode_count: s.episode_count,
        }))
      : [
          { season_number: 1, name: "Season 1", episode_count: anime.episodes ?? 24 },
          ...(anime.relations?.edges
            ?.filter((e) => e.relationType === "SEQUEL")
            .map((e, idx) => ({
              season_number: idx + 2,
              name: getAnimeTitle(e.node.title) || `Season ${idx + 2}`,
              episode_count: e.node.episodes ?? 12,
            })) ?? []),
        ];

  const currentSeasonObj = availableSeasons.find((s) => s.season_number === selectedSeason);
  const currentSeasonEpisodes =
    tmdbEpisodes.length > 0
      ? tmdbEpisodes.length
      : currentSeasonObj?.episode_count ?? anime.episodes ?? 24;

  const filteredEpisodeNumbers = useMemo(() => {
    const allEps = Array.from({ length: currentSeasonEpisodes }, (_, i) => i + 1);
    if (!episodeFilter.trim()) return allEps;
    const q = episodeFilter.trim().toLowerCase();
    return allEps.filter((ep) => {
      const tmdbEp = tmdbEpisodes.find((e) => e.episode_number === ep);
      if (String(ep).includes(q)) return true;
      if (tmdbEp?.name?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [currentSeasonEpisodes, episodeFilter, tmdbEpisodes]);

  const bannerUrl = anime.bannerImage ?? anime.coverImage?.extraLarge;
  const coverUrl = anime.coverImage?.extraLarge ?? anime.coverImage?.large;

  // Recommendations
  const recommendations =
    anime.recommendations?.nodes
      ?.map((n) => n.mediaRecommendation)
      .filter(Boolean)
      .slice(0, 12) ?? [];

  // Manga & Source Material Relations
  const mangaRelations =
    anime.relations?.edges?.filter((e) => {
      const format = e.node?.format;
      const relType = e.relationType;
      return (
        format === "MANGA" ||
        format === "NOVEL" ||
        format === "ONE_SHOT" ||
        relType === "ADAPTATION" ||
        relType === "SOURCE"
      );
    }) ?? [];

  const primaryManga = mangaRelations[0]?.node;

  // ─── Fetch TMDB TV Details & Season List ─────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadStreamAndSeasons() {
      try {
        const ids = await resolveStreamIds(
          anime.id,
          anime.title.english || anime.title.romaji || title,
          anime.externalLinks,
          isMovie,
          anime.startDate?.year ?? undefined
        );

        if (isMounted && ids.tmdbId && !isMovie) {
          const numTmdb = parseInt(ids.tmdbId);
          if (!isNaN(numTmdb)) {
            setTmdbId(numTmdb);
            const tvDetails = await getTmdbTvDetails(numTmdb);
            if (isMounted && tvDetails?.seasons && tvDetails.seasons.length > 0) {
              const regularSeasons = tvDetails.seasons.filter((s) => s.season_number > 0);
              if (regularSeasons.length > 0) {
                setSeasons(regularSeasons);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load TMDB details:", e);
      }
    }

    loadStreamAndSeasons();
    return () => {
      isMounted = false;
    };
  }, [anime, title, isMovie]);

  // ─── Fetch Season Episodes whenever selectedSeason or tmdbId changes ────────
  useEffect(() => {
    let isMounted = true;
    async function loadEpisodes() {
      if (!tmdbId || isMovie) {
        setLoadingEpisodes(false);
        return;
      }
      setLoadingEpisodes(true);
      try {
        const eps = await getTmdbSeasonEpisodes(tmdbId, selectedSeason);
        if (isMounted) {
          setTmdbEpisodes(eps);
        }
      } catch (e) {
        console.warn("Failed to load episodes for season:", e);
      } finally {
        if (isMounted) setLoadingEpisodes(false);
      }
    }

    loadEpisodes();
    return () => {
      isMounted = false;
    };
  }, [tmdbId, selectedSeason, isMovie]);

  const handleListToggle = () => {
    if (inList) {
      removeFromList(anime.id);
      info(`Removed "${title}" from your list`);
    } else {
      addToList({
        id: anime.id,
        title,
        coverImage: coverUrl ?? "",
        genres: anime.genres ?? [],
        averageScore: anime.averageScore ?? null,
        episodes: anime.episodes ?? null,
        status: anime.status ?? "",
      });
      success(`Added "${title}" to your list`);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      info("Link copied to clipboard!");
    }
  };

  // Match score (Netflix-style e.g. 98% Match)
  const matchPercent = anime.averageScore ? Math.min(Math.round(anime.averageScore + 8), 99) : 95;

  return (
    <div className="min-h-screen bg-kuro-bg text-kuro-text pb-28 sm:pb-20">
      {/* ─── Netflix Cinematic Full-Bleed Hero ─────────────────────────────── */}
      <div className="relative w-full min-h-[88svh] sm:min-h-[720px] md:min-h-[780px] lg:h-[88vh] max-h-[960px] overflow-hidden">
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt={title}
            fill
            priority
            className="object-cover object-center scale-105 transition-transform duration-1000"
            sizes="100vw"
          />
        )}

        {/* Netflix Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-kuro-bg via-kuro-bg/85 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-t from-kuro-bg via-kuro-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent h-36" />

        {/* Hero Details Content */}
        <div className="absolute inset-0 flex flex-col justify-end pt-28 sm:pt-36 md:pt-40 pb-14 sm:pb-20 px-6 md:px-16 max-w-7xl mx-auto z-10">
          <div className="max-w-3xl">
            {/* KuroStream Brand & Top 10 Ribbon */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 mb-3.5 flex-wrap"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-magenta-400">
                <Zap size={14} className="fill-magenta-400 text-magenta-400" />
                <span>ANIMA SERIES</span>
              </div>

              <span className="text-white/20">•</span>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-magenta-500 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                <span>TOP 10</span>
              </div>

              <span className="text-xs font-bold text-white/90">#1 in Anime Series Today</span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <DualToneHeading
                as="h1"
                text={title}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight"
              />
            </motion.div>

            {/* Badges Row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap items-center gap-3 text-sm font-semibold mb-6"
            >
              {/* Match % */}
              <span className="text-magenta-400 font-black">{matchPercent}% Match</span>

              {/* Release Year */}
              {anime.seasonYear && <span className="text-white/80">{anime.seasonYear}</span>}

              {/* Maturity Rating */}
              <span className="px-1.5 py-0.5 text-[11px] font-bold text-white/90 border border-white/40 rounded-sm leading-none">
                16+
              </span>

              {/* Episode count */}
              <span className="text-white/80">
                {isMovie ? "Movie" : `${currentSeasonEpisodes} Episodes`}
              </span>

              {/* Quality & Audio Badges */}
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold text-white/90 border border-white/30 rounded-sm leading-none">
                Ultra HD 4K
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold text-white/90 border border-white/30 rounded-sm leading-none">
                5.1
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold text-white/90 border border-white/30 rounded-sm leading-none">
                Sub & Dub
              </span>
            </motion.div>

            {/* Actions: Big Magenta Play Button + List + Like */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-3.5"
            >
              <Link href={`/watch/${anime.id}/1?season=${selectedSeason}`}>
                <button className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-magenta-500 text-white font-black text-base hover:bg-magenta-400 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,42,133,0.55)]">
                  <Play size={22} className="fill-white text-white ml-0.5" />
                  <span>Play</span>
                </button>
              </Link>

              {/* Add to list */}
              <button
                onClick={handleListToggle}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold border transition-all active:scale-95",
                  inList
                    ? "bg-magenta-500/20 border-magenta-500 text-magenta-400 shadow-[0_0_15px_rgba(255,42,133,0.3)]"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                )}
              >
                {inList ? <Check size={18} className="stroke-[3]" /> : <Plus size={18} />}
                <span>{inList ? "In My List" : "My List"}</span>
              </button>

              {/* Like / Thumbs Up */}
              <button
                onClick={() => {
                  setLiked(!liked);
                  if (!liked) success("Added to your favorites!");
                }}
                className={cn(
                  "p-3.5 rounded-xl border transition-all active:scale-95",
                  liked
                    ? "bg-magenta-500/20 border-magenta-500 text-magenta-400 shadow-[0_0_15px_rgba(255,42,133,0.3)]"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                )}
                title={liked ? "Liked" : "Like this anime"}
              >
                <ThumbsUp size={18} className={liked ? "fill-current" : ""} />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
                title="Share anime link"
              >
                <Share2 size={18} />
              </button>

              {/* Read Original Manga Button */}
              {primaryManga && (
                <Link
                  href={`/manga/${primaryManga.id}`}
                  className="flex items-center gap-2 px-4 sm:px-5 py-3.5 rounded-xl bg-magenta-500/15 hover:bg-magenta-500/25 border border-magenta-500/40 text-magenta-300 hover:text-white font-bold text-sm shadow-[0_0_20px_rgba(255,42,133,0.25)] transition-all active:scale-95"
                >
                  <BookOpen size={18} />
                  <span className="hidden sm:inline">Read Manga</span>
                  <span className="sm:hidden">Manga</span>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── Netflix Two-Column Overview & Meta Info ─────────────────────────── */}
      <div className="px-4 sm:px-6 md:px-16 max-w-7xl mx-auto -mt-4 sm:-mt-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 py-6 border-b border-white/10">
          {/* Left 2 Cols: Synopsis & tags */}
          <div className="lg:col-span-2">
            <p className="text-white/90 text-base sm:text-lg leading-relaxed font-normal">
              {synopsisExpanded || !needsExpand ? synopsis : shortSynopsis + "..."}
            </p>
            {needsExpand && (
              <button
                onClick={() => setSynopsisExpanded((v) => !v)}
                className="text-magenta-400 text-sm font-bold mt-2.5 hover:text-magenta-300 transition-colors flex items-center gap-1"
              >
                {synopsisExpanded ? (
                  <>
                    Show Less <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    Read More <ChevronDown size={16} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column: Cast, Genres, Mood tags */}
          <div className="flex flex-col gap-3.5 text-xs">
            {anime.studios?.nodes?.[0] && (
              <div>
                <span className="text-white/50">Studio: </span>
                <span className="text-white font-medium">{anime.studios.nodes[0].name}</span>
              </div>
            )}

            <div>
              <span className="text-white/50">Genres: </span>
              <span className="text-white font-medium">
                {anime.genres?.map((g, i) => (
                  <span key={g}>
                    <Link
                      href={`/search?genre=${g}`}
                      className="hover:text-magenta-400 transition-colors hover:underline"
                    >
                      {g}
                    </Link>
                    {i < (anime.genres?.length ?? 1) - 1 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>

            <div>
              <span className="text-white/50">This show is: </span>
              <span className="text-white font-medium">
                {anime.genres?.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="inline-block mr-1.5 px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-white/90"
                  >
                    {g}
                  </span>
                ))}
              </span>
            </div>

            {anime.averageScore && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-white/50">Community Rating:</span>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-magenta-500/10 border border-magenta-500/30 text-magenta-400 font-bold">
                  <Star size={12} className="fill-magenta-400" />
                  <span>{formatScore(anime.averageScore)} / 10</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Episodes Section with Season Filter ─────────────────────── */}
        {!isMovie && (
          <section className="mt-8 sm:mt-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4 flex-wrap">
                <DualToneHeading
                  as="h2"
                  text="Season Episodes"
                  className="text-2xl md:text-3xl font-black tracking-tight"
                />

                {/* Season Dropdown Selector */}
                <div className="relative inline-flex items-center">
                  <select
                    id="season-selector"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="appearance-none bg-kuro-card/90 hover:bg-white/[0.08] text-white border border-white/15 focus:border-magenta-500 text-xs font-black px-4 py-2 pr-9 rounded-xl cursor-pointer transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-magenta-500"
                  >
                    {availableSeasons.map((s) => (
                      <option
                        key={s.season_number}
                        value={s.season_number}
                        className="bg-black text-white font-semibold py-1"
                      >
                        {s.name || `Season ${s.season_number}`} {s.episode_count ? `(${s.episode_count} eps)` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-magenta-400 pointer-events-none stroke-[2.5]"
                  />
                </div>
              </div>

              {/* Season Pills Filter for Quick Switching */}
              {availableSeasons.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
                  {availableSeasons.map((s) => {
                    const isActive = selectedSeason === s.season_number;
                    return (
                      <button
                        key={s.season_number}
                        onClick={() => setSelectedSeason(s.season_number)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5",
                          isActive
                            ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-[0_0_15px_rgba(255,42,133,0.45)]"
                            : "bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]"
                        )}
                      >
                        <span>{s.name || `Season ${s.season_number}`}</span>
                        {s.episode_count && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded font-mono font-bold",
                              isActive ? "bg-black/20 text-white" : "bg-white/10 text-white/70"
                            )}
                          >
                            {s.episode_count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Controls: Search, View Mode Switcher, and Total Count */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search / Filter Episode */}
                {currentSeasonEpisodes > 6 && (
                  <div className="relative flex items-center">
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Find ep #..."
                      value={episodeFilter}
                      onChange={(e) => setEpisodeFilter(e.target.value)}
                      className="pl-7 pr-7 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-magenta-500 text-xs text-white placeholder-white/40 focus:outline-none w-28 sm:w-36 transition-all"
                    />
                    {episodeFilter && (
                      <button
                        onClick={() => setEpisodeFilter("")}
                        className="absolute right-2 text-white/40 hover:text-white"
                        title="Clear filter"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* View Mode Switcher (Row, Grid, Pills) */}
                <div className="flex items-center p-0.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <button
                    onClick={() => setEpisodeViewMode("row")}
                    title="Compact Row List"
                    className={cn(
                      "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                      episodeViewMode === "row"
                        ? "bg-magenta-500 text-white shadow-sm"
                        : "text-white/50 hover:text-white"
                    )}
                  >
                    <List size={14} />
                    <span className="hidden sm:inline text-[11px]">Rows</span>
                  </button>
                  <button
                    onClick={() => setEpisodeViewMode("grid")}
                    title="Grid Cards View"
                    className={cn(
                      "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                      episodeViewMode === "grid"
                        ? "bg-magenta-500 text-white shadow-sm"
                        : "text-white/50 hover:text-white"
                    )}
                  >
                    <LayoutGrid size={14} />
                    <span className="hidden sm:inline text-[11px]">Grid</span>
                  </button>
                  <button
                    onClick={() => setEpisodeViewMode("pills")}
                    title="Numbers Only (Fast Jump)"
                    className={cn(
                      "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                      episodeViewMode === "pills"
                        ? "bg-magenta-500 text-white shadow-sm"
                        : "text-white/50 hover:text-white"
                    )}
                  >
                    <Hash size={14} />
                    <span className="hidden sm:inline text-[11px]">Pills</span>
                  </button>
                </div>

                <span className="text-xs font-semibold text-white/50 font-mono">
                  {filteredEpisodeNumbers.length} / {currentSeasonEpisodes} eps
                </span>
              </div>
            </div>

            {/* Episode Display Area */}
            {loadingEpisodes ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/60">
                <div className="w-8 h-8 rounded-full border-2 border-magenta-500 border-t-transparent animate-spin" />
                <span className="text-xs font-medium">Loading Season {selectedSeason} episodes...</span>
              </div>
            ) : filteredEpisodeNumbers.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mt-4">
                <p className="text-sm font-semibold text-white/80 mb-1">No episodes matched &quot;{episodeFilter}&quot;</p>
                <button
                  onClick={() => setEpisodeFilter("")}
                  className="text-xs text-magenta-400 hover:underline font-bold mt-2"
                >
                  Clear search filter
                </button>
              </div>
            ) : episodeViewMode === "row" ? (
              /* ─── Compact Horizontal Rows View (Default, Mobile Friendly) ─────────── */
              <div className="flex flex-col gap-2 mt-4">
                {filteredEpisodeNumbers.map((ep) => {
                  const tmdbEp = tmdbEpisodes.find((e) => e.episode_number === ep);
                  const epTitle = tmdbEp?.name ?? `Episode ${ep}`;
                  const epOverview = tmdbEp?.overview || "";
                  const epRuntime = tmdbEp?.runtime ? `${tmdbEp.runtime}m` : "24m";
                  const stillUrl = tmdbEp?.still_path
                    ? `https://image.tmdb.org/t/p/w300${tmdbEp.still_path}`
                    : bannerUrl || coverUrl;
                  const watchedProgress = getProgress(anime.id, ep, selectedSeason);
                  const isWatched = watchedProgress >= 0.85;

                  return (
                    <Link
                      key={`${selectedSeason}-${ep}`}
                      href={`/watch/${anime.id}/${ep}?season=${selectedSeason}`}
                      className="group flex flex-row items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl hover:bg-white/[0.06] bg-white/[0.02] border border-white/[0.05] hover:border-magenta-500/30 transition-all cursor-pointer"
                    >
                      {/* Ep index number */}
                      <span className="w-6 sm:w-7 text-center text-xs font-mono font-bold text-white/40 group-hover:text-magenta-400 transition-colors flex-shrink-0">
                        {ep}
                      </span>

                      {/* Compact 16:9 Thumbnail */}
                      <div className="relative w-24 sm:w-32 md:w-36 aspect-video rounded-lg overflow-hidden bg-kuro-surface flex-shrink-0 border border-white/10 shadow-sm">
                        {stillUrl ? (
                          <Image
                            src={stillUrl}
                            alt={epTitle}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="144px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film size={18} className="text-white/20" />
                          </div>
                        )}

                        {/* Play overlay on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-magenta-500 text-white flex items-center justify-center shadow-md">
                            <Play size={12} className="fill-white text-white ml-0.5" />
                          </div>
                        </div>

                        {/* Watched progress bar */}
                        {watchedProgress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div
                              className="h-full bg-magenta-500"
                              style={{ width: `${Math.min(watchedProgress * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Episode Title & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-mono font-bold text-magenta-400 flex-shrink-0">
                            EP {ep}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-white group-hover:text-magenta-300 transition-colors truncate">
                            {epTitle}
                          </span>
                        </div>
                        {epOverview ? (
                          <p className="text-[11px] text-white/50 line-clamp-1 leading-snug">
                            {epOverview}
                          </p>
                        ) : null}
                      </div>

                      {/* Runtime, Watched badge, Play button */}
                      <div className="flex items-center gap-2.5 flex-shrink-0 ml-1">
                        <span className="text-[11px] font-mono text-white/40 hidden sm:inline">
                          {epRuntime}
                        </span>
                        {isWatched && (
                          <span
                            title="Watched"
                            className="w-5 h-5 rounded-full bg-magenta-500/20 border border-magenta-500/40 flex items-center justify-center text-magenta-400"
                          >
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                        <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-magenta-500 text-white/40 group-hover:text-white transition-all flex items-center justify-center">
                          <Play size={12} className="fill-current ml-0.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : episodeViewMode === "grid" ? (
              /* ─── Compact Grid Cards View ─────────────────────────────────────────── */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
                {filteredEpisodeNumbers.map((ep) => {
                  const tmdbEp = tmdbEpisodes.find((e) => e.episode_number === ep);
                  const epTitle = tmdbEp?.name ?? `Episode ${ep}`;
                  const epRuntime = tmdbEp?.runtime ? `${tmdbEp.runtime}m` : "24m";
                  const stillUrl = tmdbEp?.still_path
                    ? `https://image.tmdb.org/t/p/w300${tmdbEp.still_path}`
                    : bannerUrl || coverUrl;
                  const watchedProgress = getProgress(anime.id, ep, selectedSeason);
                  const isWatched = watchedProgress >= 0.85;

                  return (
                    <Link
                      key={`${selectedSeason}-${ep}`}
                      href={`/watch/${anime.id}/${ep}?season=${selectedSeason}`}
                      className="group relative rounded-xl bg-kuro-card/80 border border-white/10 hover:border-magenta-500/50 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-md flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-video bg-kuro-surface">
                        {stillUrl ? (
                          <Image
                            src={stillUrl}
                            alt={epTitle}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="240px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film size={20} className="text-white/20" />
                          </div>
                        )}

                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono font-black text-magenta-400 border border-white/10">
                          EP {ep}
                        </span>
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-white/70">
                          {epRuntime}
                        </span>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-magenta-500 flex items-center justify-center text-white shadow-lg">
                            <Play size={13} className="fill-white ml-0.5" />
                          </div>
                        </div>

                        {watchedProgress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div
                              className="h-full bg-magenta-500"
                              style={{ width: `${Math.min(watchedProgress * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-white group-hover:text-magenta-400 transition-colors truncate">
                          {epTitle}
                        </h4>
                        {isWatched && (
                          <span className="text-[10px] font-mono text-magenta-400 mt-1 flex items-center gap-1 font-bold">
                            <Check size={10} strokeWidth={3} /> Watched
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* ─── Numbers-Only Fast Tap Pills View (Zero Scroll) ─────────────────── */
              <div className="flex flex-wrap gap-2 mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                {filteredEpisodeNumbers.map((ep) => {
                  const watchedProgress = getProgress(anime.id, ep, selectedSeason);
                  const isWatched = watchedProgress >= 0.85;
                  const tmdbEp = tmdbEpisodes.find((e) => e.episode_number === ep);
                  const epTitle = tmdbEp?.name ?? `Episode ${ep}`;

                  return (
                    <Link
                      key={`${selectedSeason}-${ep}`}
                      href={`/watch/${anime.id}/${ep}?season=${selectedSeason}`}
                      title={epTitle}
                      className={cn(
                        "w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono transition-all border group",
                        isWatched
                          ? "bg-magenta-500/15 border-magenta-500/40 text-magenta-300 hover:bg-magenta-500 hover:text-white"
                          : "bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-magenta-500/30"
                      )}
                    >
                      <span className="text-xs font-black">{ep}</span>
                      {isWatched && (
                        <span className="w-1.5 h-1.5 rounded-full bg-magenta-400 group-hover:bg-white -mt-0.5" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ─── Original Manga & Source Material Spotlight ──────────────────── */}
        {mangaRelations.length > 0 && (
          <section className="mt-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-magenta-950/25 via-kuro-card/90 to-purple-950/25 border border-magenta-500/20 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-magenta-400 font-bold mb-1">
                  <BookOpen size={14} />
                  <span>Original Source Material</span>
                </div>
                <DualToneHeading
                  as="h2"
                  text="Manga & Novel Adaptation"
                  className="text-2xl md:text-3xl font-black tracking-tight"
                />
              </div>

              <Link
                href="/manga"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/90 hover:text-white border border-white/10 transition-colors"
              >
                <span>Browse All Manga</span>
                <ChevronDown size={14} className="-rotate-90" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mangaRelations.map(({ node, relationType }) => {
                const mTitle = node.title?.english || node.title?.romaji || "Manga";
                return (
                  <Link
                    key={node.id}
                    href={`/manga/${node.id}`}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-magenta-500/40 transition-all hover:shadow-[0_0_25px_rgba(255,42,133,0.2)]"
                  >
                    <div className="relative w-16 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
                      <Image
                        src={node.coverImage?.large || coverUrl}
                        alt={mTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-magenta-500/20 text-magenta-400 border border-magenta-500/30">
                          {relationType || node.format || "MANGA"}
                        </span>
                        {node.averageScore && (
                          <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-0.5">
                            <Star size={10} className="fill-yellow-400 text-yellow-400" />
                            {(node.averageScore / 10).toFixed(1)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-magenta-400 transition-colors truncate">
                        {mTitle}
                      </h3>

                      <p className="text-xs text-kuro-text-dim mt-0.5">
                        {node.chapters ? `${node.chapters} Chapters` : "Digital Release"}
                        {node.volumes ? ` • ${node.volumes} Vols` : ""}
                      </p>

                      <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-magenta-400 group-hover:underline">
                        <span>Read on Anima Stream</span>
                        <ChevronDown size={12} className="-rotate-90" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Netflix "More Like This" Grid ─────────────────────────────────── */}
        {recommendations.length > 0 && (
          <section className="mt-16">
            <div className="mb-6">
              <DualToneHeading
                as="h2"
                text="More Like This"
                className="text-2xl md:text-3xl font-black tracking-tight"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((rec, i) => (
                <AnimeCard key={rec.id} anime={rec as AniListMedia} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
