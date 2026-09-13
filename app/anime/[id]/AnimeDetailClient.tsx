"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { useMyList } from "@/lib/store/useMyList";
import { useWatchHistory } from "@/lib/store/useWatchHistory";
import { useToast } from "@/lib/store/useToast";
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

  const [mounted, setMounted] = useState(false);
  const { isInList, addToList, removeFromList } = useMyList();
  const { getProgress } = useWatchHistory();
  const { success, info } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = getAnimeTitle(anime.title);
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

  const bannerUrl = anime.bannerImage ?? anime.coverImage?.extraLarge;
  const coverUrl = anime.coverImage?.extraLarge ?? anime.coverImage?.large;

  // Recommendations
  const recommendations =
    anime.recommendations?.nodes
      ?.map((n) => n.mediaRecommendation)
      .filter(Boolean)
      .slice(0, 12) ?? [];

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
              <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.25em] text-magenta-400">
                <span className="text-base leading-none font-black text-magenta-400">⚡</span>
                <span>KURO SERIES</span>
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

              <span className="text-sm font-semibold text-white/50">
                {currentSeasonEpisodes} Episodes in Season {selectedSeason}
              </span>
            </div>

            {/* Episode Rows List */}
            {loadingEpisodes ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/60">
                <div className="w-8 h-8 rounded-full border-2 border-magenta-500 border-t-transparent animate-spin" />
                <span className="text-xs font-medium">Loading Season {selectedSeason} episodes...</span>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] mt-2">
                {Array.from({ length: currentSeasonEpisodes }, (_, i) => i + 1).map((ep) => {
                  const tmdbEp = tmdbEpisodes.find((e) => e.episode_number === ep);
                  const epTitle = tmdbEp?.name ?? `Episode ${ep}`;
                  const epOverview = tmdbEp?.overview || "No episode overview available.";
                  const epRuntime = tmdbEp?.runtime ? `${tmdbEp.runtime}m` : "24m";
                  const stillUrl = tmdbEp?.still_path
                    ? `https://image.tmdb.org/t/p/w300${tmdbEp.still_path}`
                    : bannerUrl || coverUrl;
                  const watchedProgress = getProgress(anime.id, ep);

                  return (
                    <Link
                      key={`${selectedSeason}-${ep}`}
                      href={`/watch/${anime.id}/${ep}?season=${selectedSeason}`}
                      className="group flex flex-col md:flex-row items-start md:items-center gap-4 py-5 hover:bg-white/[0.03] px-3 sm:px-4 rounded-2xl transition-colors cursor-pointer"
                    >
                      {/* Episode Number */}
                      <div className="w-8 text-center text-xl font-black text-white/40 group-hover:text-magenta-400 transition-colors flex-shrink-0">
                        {ep}
                      </div>

                      {/* 16:9 Thumbnail with Magenta Progress Bar */}
                      <div className="relative w-full sm:w-44 md:w-48 aspect-video rounded-xl overflow-hidden bg-kuro-surface flex-shrink-0 border border-white/10 shadow-md">
                        {stillUrl ? (
                          <Image
                            src={stillUrl}
                            alt={epTitle}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="192px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film size={24} className="text-white/20" />
                          </div>
                        )}

                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-magenta-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,42,133,0.6)]">
                            <Play size={16} className="fill-white text-white ml-0.5" />
                          </div>
                        </div>

                        {/* Magenta progress bar if watched */}
                        {watchedProgress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                            <div
                              className="h-full bg-magenta-500 shadow-[0_0_8px_rgba(255,42,133,0.8)]"
                              style={{ width: `${Math.min(watchedProgress * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Episode Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-4 mb-1">
                          <h3 className="text-sm md:text-base font-bold text-white group-hover:text-magenta-400 transition-colors truncate">
                            {epTitle}
                          </h3>
                          <span className="text-xs font-semibold text-white/50 flex-shrink-0">
                            {epRuntime}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                          {epOverview}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
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
