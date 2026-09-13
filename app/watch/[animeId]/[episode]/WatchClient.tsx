"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  List,
  X,
  Film,
  Info,
  CheckCheck,
  RotateCcw,
  Clock,
  Maximize2,
  Tv,
  Play,
  FastForward,
  Users,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import VidRockPlayer from "@/components/player/VidRockPlayer";
import { NativeHlsPlayer, type PlayerServer } from "@/components/player/NativeHlsPlayer";
import { EpisodeCard } from "@/components/anime/EpisodeCard";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { Button } from "@/components/ui/Button";
import { WatchPartyModal } from "@/components/party/WatchPartyModal";
import { useWatchHistory, getPlaybackTimestamp, formatTimestamp } from "@/lib/store/useWatchHistory";
import { useMoodRing } from "@/lib/store/useMoodRing";
import { getAnimeTitle, cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { getEpisodeFillerStatus, getNextCanonEpisode } from "@/lib/utils/fillerData";
import {
  resolveStreamIds,
  getTmdbTvDetails,
  getTmdbSeasonEpisodes,
  getEmbedUrl,
  type TmdbEpisode,
  type TmdbSeason,
  type StreamIds,
} from "@/lib/api/tmdb";
import type { AniListMedia } from "@/lib/types";

interface WatchClientProps {
  anime: AniListMedia;
  episode: number;
}

export function WatchClient({ anime, episode }: WatchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const initialSeason = seasonParam ? Math.max(1, parseInt(seasonParam)) : 1;

  const {
    addToHistory,
    updateProgress,
    isEpisodeWatched,
    toggleEpisodeWatched,
    getProgress,
    markSeasonCompleted,
    resetSeasonProgress,
  } = useWatchHistory();

  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [streamIds, setStreamIds] = useState<StreamIds | null>(null);
  const [loadingStream, setLoadingStream] = useState(true);
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<TmdbSeason[]>([]);
  const [tmdbEpisodes, setTmdbEpisodes] = useState<TmdbEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(false);

  // Native HLS Direct Stream & Player Mode state
  const [playerMode, setPlayerMode] = useState<"native" | "mirror">("native");
  const [directStreamUrl, setDirectStreamUrl] = useState<string | null>(null);
  const [resolvingDirectStream, setResolvingDirectStream] = useState(true);
  const [jumpTimeTarget, setJumpTimeTarget] = useState<number | null>(null);

  // Picture-in-Picture & Floating Mini-Player state
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const [manualPip, setManualPip] = useState(false);
  const [dismissedPip, setDismissedPip] = useState(false);
  const [resumeTimestamp, setResumeTimestamp] = useState<string | null>(null);
  const [servers, setServers] = useState<PlayerServer[]>([
    { id: "direct", name: "Direct HLS", tag: "Ad-Free", isDirect: true },
    { id: "vidrock", name: "Server 1", tag: "Fast CDN" },
    { id: "vidsrcsbs", name: "Server 2", tag: "HD Mirror" },
    { id: "vidsrcto", name: "Server 3", tag: "Backup" },
  ]);
  const [activeServerId, setActiveServerId] = useState<string>("direct");
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  // Smart Canon & Filler Shield state
  const [skipFillerMode, setSkipFillerMode] = useState(true);

  // KuroSync Watch Party Modal state
  const [showPartyModal, setShowPartyModal] = useState(false);
  const { setMoodFromGenres } = useMoodRing();

  useEffect(() => {
    setMoodFromGenres(anime.genres, getAnimeTitle(anime.title));
  }, [anime.genres, anime.title, setMoodFromGenres]);

  // Parse exact timestamp hash e.g. #t=12m30s
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash && hash.includes("t=")) {
        setResumeTimestamp(hash.replace("#t=", ""));
      }
    }
  }, []);

  // Scroll detection to auto-dock into floating mini-player
  useEffect(() => {
    const handleScroll = () => {
      if (!playerContainerRef.current) return;
      const rect = playerContainerRef.current.getBoundingClientRect();
      const scrolledPast = rect.bottom < 60;
      setIsScrolledPast(scrolledPast);
      if (!scrolledPast) {
        setDismissedPip(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isFloatingPip = (manualPip || isScrolledPast) && !dismissedPip;

  // Sync if URL seasonParam changes
  useEffect(() => {
    if (seasonParam) {
      const parsed = parseInt(seasonParam);
      if (!isNaN(parsed) && parsed !== selectedSeason) {
        setSelectedSeason(parsed);
      }
    }
  }, [seasonParam, selectedSeason]);

  const title = getAnimeTitle(anime.title);
  const isMovie = anime.format === "MOVIE";
  const currentFillerStatus = getEpisodeFillerStatus(title, episode);
  const nextCanonEpisodeNum = getNextCanonEpisode(title, episode);
  const nextFillerStatus = getEpisodeFillerStatus(title, episode + 1);
  const isNextFiller = nextFillerStatus.isFiller;

  const recommendations =
    anime.recommendations?.nodes
      ?.map((n) => n.mediaRecommendation)
      .filter((rec): rec is AniListMedia => Boolean(rec && rec.id)) || [];

  // Available seasons
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
  const episodeCount =
    tmdbEpisodes.length > 0
      ? tmdbEpisodes.length
      : currentSeasonObj?.episode_count ?? anime.episodes ?? 24;

  const hasNext = !isMovie && episode < episodeCount;
  const hasPrev = !isMovie && episode > 1;

  // Watched stats for active season
  const watchedCount = Array.from({ length: episodeCount }, (_, i) => i + 1).filter((ep) =>
    isEpisodeWatched(anime.id, ep, selectedSeason)
  ).length;
  const seasonProgressPercent = Math.round((watchedCount / (episodeCount || 1)) * 100);

  // Find current episode name from TMDB if available
  const currentTmdbEpisode = tmdbEpisodes.find((e) => e.episode_number === episode);
  const episodeName = currentTmdbEpisode?.name ?? `Episode ${episode}`;

  // ─── Resolve Stream IDs & Fetch TV Details (Seasons) ─────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function resolve() {
      setLoadingStream(true);

      const searchTitle = anime.title.english || anime.title.romaji || title;
      const releaseYear = anime.startDate?.year ?? undefined;

      try {
        const ids = await resolveStreamIds(
          anime.id,
          searchTitle,
          anime.externalLinks,
          isMovie,
          releaseYear
        );

        if (isMounted) {
          setStreamIds(ids);

          if (!isMovie && ids.tmdbId) {
            const numTmdb = parseInt(ids.tmdbId);
            if (!isNaN(numTmdb)) {
              setTmdbId(numTmdb);
              const tvDetails = await getTmdbTvDetails(numTmdb);
              if (isMounted && tvDetails?.seasons && tvDetails.seasons.length > 0) {
                const regular = tvDetails.seasons.filter((s) => s.season_number > 0);
                if (regular.length > 0) setSeasons(regular);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to resolve stream IDs:", e);
        if (isMounted) {
          setStreamIds({
            tmdbId: String(anime.id),
            primaryId: String(anime.id),
          });
        }
      } finally {
        if (isMounted) setLoadingStream(false);
      }
    }

    resolve();
    return () => {
      isMounted = false;
    };
  }, [anime, title, isMovie]);

  // ─── Direct HLS Stream Resolution ───────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    setResolvingDirectStream(true);

    async function fetchDirectStream() {
      try {
        const titleQuery = anime.title.english || anime.title.romaji || title;
        const res = await fetch(
          `/api/anime/stream?animeId=${anime.id}&episode=${episode}&season=${selectedSeason}&title=${encodeURIComponent(titleQuery)}`
        );
        if (!res.ok) {
          throw new Error(`Direct stream endpoint status ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          if (data.servers && Array.isArray(data.servers)) {
            setServers(data.servers);
          }
          if (data.directUrl) {
            setDirectStreamUrl(data.directUrl);
            setPlayerMode("native");
            setActiveServerId("direct");
          } else {
            setDirectStreamUrl(null);
            setPlayerMode("mirror");
            setActiveServerId("vidrock");
          }
        }
      } catch (err) {
        console.warn("Direct HLS stream unavailable, falling back to embed mirrors:", err);
        if (isMounted) {
          setDirectStreamUrl(null);
          setPlayerMode("mirror");
          setActiveServerId("vidrock");
        }
      } finally {
        if (isMounted) {
          setResolvingDirectStream(false);
        }
      }
    }

    fetchDirectStream();
    return () => {
      isMounted = false;
    };
  }, [anime.id, anime.title.english, anime.title.romaji, episode, selectedSeason, title]);

  // ─── Sync Auto-Resume Timestamp from Storage ────────────────────────────────
  useEffect(() => {
    const saved = getPlaybackTimestamp(anime.id, episode, selectedSeason);
    if (saved && saved.currentTime > 10 && (!resumeTimestamp || resumeTimestamp === "0s")) {
      setResumeTimestamp(saved.formatted || formatTimestamp(saved.currentTime));
    }
  }, [anime.id, episode, selectedSeason, resumeTimestamp]);

  // ─── Fetch Episodes for Current Season ──────────────────────────────────────
  useEffect(() => {
    if (!tmdbId || isMovie) return;
    let isMounted = true;
    setLoadingEpisodes(true);

    async function loadEpisodes() {
      try {
        const eps = await getTmdbSeasonEpisodes(tmdbId!, selectedSeason);
        if (isMounted && eps.length > 0) {
          setTmdbEpisodes(eps);
        } else if (isMounted) {
          setTmdbEpisodes([]);
        }
      } catch (e) {
        console.warn("Failed to load season episodes:", e);
      } finally {
        if (isMounted) setLoadingEpisodes(false);
      }
    }

    loadEpisodes();
    return () => {
      isMounted = false;
    };
  }, [tmdbId, selectedSeason, isMovie]);

  // ─── Track watch history ──────────────────────────────────────────────────────
  useEffect(() => {
    addToHistory({
      animeId: anime.id,
      animeTitile: title,
      coverImage: anime.coverImage?.large ?? "",
      episode,
      season: selectedSeason,
      progress: 0.05,
      totalDuration: 1440,
    });
    updateProgress(anime.id, episode, 0.05, selectedSeason);
  }, [anime.id, anime.coverImage?.large, episode, selectedSeason, title, addToHistory, updateProgress]);

  // ─── Navigation ───────────────────────────────────────────────────────────────
  const goToEpisode = useCallback(
    (ep: number, seasonNum = selectedSeason) => {
      router.push(`/watch/${anime.id}/${ep}?season=${seasonNum}`);
    },
    [router, anime.id, selectedSeason]
  );

  const handleNext = useCallback(() => {
    if (!hasNext) return;
    if (skipFillerMode && isNextFiller && nextCanonEpisodeNum !== episode) {
      goToEpisode(nextCanonEpisodeNum);
    } else {
      goToEpisode(episode + 1);
    }
  }, [hasNext, goToEpisode, episode, skipFillerMode, isNextFiller, nextCanonEpisodeNum]);

  const handlePrev = useCallback(() => {
    if (hasPrev) goToEpisode(episode - 1);
  }, [hasPrev, goToEpisode, episode]);

  const handleJumpTimestamp = useCallback((seconds: number) => {
    playerContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setJumpTimeTarget(seconds);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeHash = `${mins}m${secs}s`;
    setResumeTimestamp(timeHash);
    window.location.hash = `t=${timeHash}`;
  }, []);

  // ─── Global Keyboard Shortcuts for Fullscreen & Navigation ──────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          playerContainerRef.current?.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSeasonSelect = (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    router.push(`/watch/${anime.id}/1?season=${seasonNum}`);
  };

  const streamId = streamIds?.tmdbId || streamIds?.imdbId || String(anime.id);

  return (
    <div className="min-h-screen bg-kuro-bg pb-28 sm:pb-24 pt-16 relative">
      {/* Top breadcrumb & actions */}
      <div className="px-4 sm:px-6 md:px-12 py-3 border-b border-kuro-border bg-kuro-surface/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/anime/${anime.id}`}
            className="flex items-center gap-1 text-xs text-kuro-text-dim hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Details</span>
          </Link>
          <span className="text-kuro-muted text-xs">•</span>
          <h1 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
            {title}
          </h1>
          <span className="text-kuro-muted text-xs hidden sm:inline">•</span>
          <span className="text-xs text-magenta-400 font-bold hidden sm:inline">
            {isMovie ? "Movie" : `S${selectedSeason} • EP ${episode}`}
          </span>
          <span className={cn("hidden sm:inline-flex text-[9px] font-black px-2 py-0.5 rounded-full border", currentFillerStatus.badgeColor, currentFillerStatus.textColor)}>
            {currentFillerStatus.label}
          </span>
          {resumeTimestamp && (
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-magenta-500/10 border border-magenta-500/30 text-[10px] text-magenta-400 font-mono font-bold">
              <Clock size={10} />
              Resume #{resumeTimestamp}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* KuroSync Watch Party Button */}
          <button
            onClick={() => setShowPartyModal(true)}
            title="Watch in sync with friends (KuroSync)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-magenta-500/20 border border-white/10 hover:border-magenta-500/40 text-white/90 hover:text-white transition-all shadow-sm group"
          >
            <Users size={13} className="text-magenta-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Watch Party</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-500/20 text-red-400 font-bold hidden md:inline">
              LIVE
            </span>
          </button>

          {/* Next Episode Button */}
          {hasNext && (
            <button
              onClick={handleNext}
              title={`Next Episode (${episode + 1})`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-magenta-500/20 border border-white/10 hover:border-magenta-500/40 text-white/90 hover:text-white transition-all shadow-sm group"
            >
              <FastForward size={12} className="text-magenta-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Next: Ep {episode + 1}</span>
              <span className="sm:hidden">Ep {episode + 1}</span>
            </button>
          )}

          {!isMovie && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowEpisodeList(true)}
              className="flex items-center gap-1.5 text-xs py-1.5 px-3 hover:border-magenta-500/60"
            >
              <List size={14} />
              <span>Episodes</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main player & episode theater layout */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 mx-auto max-w-[1750px] w-full space-y-6">
        {/* Top Theater Grid: Big Player on Left, Docked Episode Drawer on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Big Player Column */}
          <div className={cn(!isMovie ? "lg:col-span-8 xl:col-span-9" : "col-span-12")}>
            <div ref={playerContainerRef}>
              {resolvingDirectStream && loadingStream ? (
                <div className="w-full aspect-video rounded-2xl bg-kuro-surface border border-kuro-border flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-magenta-500 border-t-transparent animate-spin" />
                  <p className="text-sm text-kuro-text-dim">Connecting to optimal stream servers...</p>
                </div>
              ) : playerMode === "native" && directStreamUrl ? (
                <NativeHlsPlayer
                  streamUrl={directStreamUrl}
                  animeId={anime.id}
                  season={selectedSeason}
                  episode={episode}
                  isMovie={isMovie}
                  title={title}
                  episodeName={episodeName}
                  coverImage={anime.coverImage?.large ?? ""}
                  hasNext={hasNext}
                  hasPrev={hasPrev}
                  onNextEpisode={handleNext}
                  onPrevEpisode={handlePrev}
                  onFallbackToMirror={() => {
                    setPlayerMode("mirror");
                    setActiveServerId("vidrock");
                  }}
                  jumpToTime={jumpTimeTarget}
                  servers={servers}
                  activeServerId={activeServerId}
                  onSelectServer={(srvId) => {
                    setActiveServerId(srvId);
                    if (srvId === "direct" && directStreamUrl) {
                      setPlayerMode("native");
                    } else {
                      setPlayerMode("mirror");
                    }
                  }}
                />
              ) : streamIds?.primaryId ? (
                <VidRockPlayer
                  tmdbId={streamIds.tmdbId}
                  imdbId={streamIds.imdbId}
                  season={selectedSeason}
                  episode={episode}
                  isMovie={isMovie}
                  title={title}
                  episodeName={episodeName}
                  hasNext={hasNext}
                  hasPrev={hasPrev}
                  onNextEpisode={handleNext}
                  onPrevEpisode={handlePrev}
                  onTogglePip={() => setManualPip(!manualPip)}
                  isPipActive={isFloatingPip}
                  directStreamUrl={directStreamUrl}
                  onSelectNativeStream={() => setPlayerMode("native")}
                />
              ) : (
                <div className="w-full aspect-video rounded-2xl bg-kuro-surface border border-kuro-border flex flex-col items-center justify-center text-center p-6">
                  <Film size={40} className="text-kuro-muted mb-3" />
                  <p className="text-white font-medium mb-1">Stream source unavailable</p>
                  <p className="text-kuro-muted text-xs max-w-sm mb-4">
                    We couldn't connect this title to any streaming server.
                  </p>
                  <Button size="sm" onClick={() => router.push(`/anime/${anime.id}`)}>
                    Back to Details
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Docked Episode Selector Drawer (Miruro-style) */}
          {!isMovie && (
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="bg-kuro-surface/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col h-[520px] sm:h-[580px] lg:h-[640px] xl:h-[700px]">
                {/* Header: Season & Count */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3 relative">
                  <div className="flex items-center gap-2">
                    <List size={16} className="text-magenta-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Episodes
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                      {episodeCount}
                    </span>
                  </div>

                  {/* Sleek Custom Season Switcher Dropdown */}
                  {availableSeasons.length > 1 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSeasonDropdown((prev) => !prev)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 hover:border-magenta-500/50 text-xs font-bold text-white transition-all shadow-sm group"
                      >
                        <span className="truncate max-w-[110px] sm:max-w-[130px]">
                          {availableSeasons.find((s) => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}
                        </span>
                        <ChevronDown
                          size={13}
                          className={cn(
                            "text-magenta-400 transition-transform duration-200",
                            showSeasonDropdown ? "rotate-180" : ""
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {showSeasonDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl bg-black/95 backdrop-blur-2xl border border-white/15 p-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.9)] space-y-1 max-h-64 overflow-y-auto custom-scrollbar"
                          >
                            <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 border-b border-white/10 mb-1 flex items-center justify-between">
                              <span>Select Season</span>
                              <span className="text-magenta-400 font-mono">{availableSeasons.length}</span>
                            </div>
                            {availableSeasons.map((s) => {
                              const isSelected = selectedSeason === s.season_number;
                              return (
                                <button
                                  key={s.season_number}
                                  type="button"
                                  onClick={() => {
                                    handleSeasonSelect(s.season_number);
                                    setShowSeasonDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left",
                                    isSelected
                                      ? "bg-magenta-500 text-white font-black shadow-[0_0_12px_rgba(255,42,133,0.5)]"
                                      : "text-white/80 hover:bg-white/10 hover:text-white"
                                  )}
                                >
                                  <span className="truncate pr-2">{s.name || `Season ${s.season_number}`}</span>
                                  {s.episode_count && (
                                    <span
                                      className={cn(
                                        "text-[10px] font-mono px-1.5 py-0.2 rounded",
                                        isSelected ? "bg-black/30 text-white" : "bg-white/10 text-white/60"
                                      )}
                                    >
                                      {s.episode_count} eps
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Airing countdown banner if available */}
                {anime.nextAiringEpisode && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-magenta-500/10 border border-magenta-500/25 flex items-center gap-2 text-xs">
                    <Clock size={13} className="text-magenta-400 animate-pulse flex-shrink-0" />
                    <span className="text-white/80 font-medium text-[11px] truncate">
                      Ep {anime.nextAiringEpisode.episode} airs in{" "}
                      <strong className="text-magenta-400 font-bold">
                        {Math.floor(anime.nextAiringEpisode.timeUntilAiring / 86400)}d{" "}
                        {Math.floor((anime.nextAiringEpisode.timeUntilAiring % 86400) / 3600)}h
                      </strong>
                    </span>
                  </div>
                )}

                {/* Scrollable list of episodes */}
                {loadingEpisodes ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-white/50">
                    <div className="w-6 h-6 rounded-full border-2 border-magenta-500 border-t-transparent animate-spin" />
                    <span className="text-xs">Loading episodes...</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => {
                      const tmdbEp = tmdbEpisodes.find((e) => e.episode_number === ep);
                      const epTitle = tmdbEp?.name ?? `Episode ${ep}`;
                      const stillUrl = tmdbEp?.still_path
                        ? `https://image.tmdb.org/t/p/w300${tmdbEp.still_path}`
                        : anime.bannerImage || anime.coverImage?.large;
                      const watched = isEpisodeWatched(anime.id, ep, selectedSeason);
                      const prog = getProgress(anime.id, ep, selectedSeason);

                      return (
                        <EpisodeCard
                          key={`${selectedSeason}-${ep}`}
                          episodeNum={ep}
                          season={selectedSeason}
                          title={epTitle}
                          thumbnail={stillUrl}
                          animeId={anime.id}
                          isActive={ep === episode}
                          isWatched={watched}
                          progress={prog}
                          fillerStatus={getEpisodeFillerStatus(title, ep)}
                          variant="compact"
                          onToggleWatched={() =>
                            toggleEpisodeWatched(
                              anime.id,
                              ep,
                              title,
                              anime.coverImage?.large || "",
                              selectedSeason
                            )
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Full-Width Section: Metadata, Progress Tracker & Recommendations */}
        <div className="space-y-6 pt-2">
          {/* Anime metadata & synopsis card */}
          <div className="bg-kuro-surface/85 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white mb-1.5">{title}</h1>
                <div className="flex items-center gap-2 text-xs text-kuro-text-dim flex-wrap">
                  {anime.format && (
                    <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-[11px]">
                      {anime.format}
                    </span>
                  )}
                  {anime.seasonYear && <span className="text-white/80 font-medium">{anime.seasonYear}</span>}
                  {anime.averageScore && (
                    <span className="text-magenta-400 font-bold flex items-center gap-1">
                      <Star size={12} className="fill-magenta-400 text-magenta-400" />
                      {(anime.averageScore / 10).toFixed(1)}
                    </span>
                  )}
                  {anime.status && (
                    <span className="text-magenta-400 font-bold px-2 py-0.5 rounded-lg bg-magenta-500/10 border border-magenta-500/20 text-[11px]">
                      {anime.status.replace("_", " ")}
                    </span>
                  )}
                  {anime.episodes && (
                    <span className="text-white/60 font-mono text-[11px]">
                      {episode} of {anime.episodes} eps
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/anime/${anime.id}`}>
                  <Button size="sm" variant="secondary" className="text-xs font-bold text-white hover:border-magenta-500/50">
                    <Info size={14} className="mr-1.5 text-magenta-400" />
                    Anime Details
                  </Button>
                </Link>
              </div>
            </div>

            {/* Genres tags */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {anime.genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/75"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {anime.description && (
              <div className="pt-1">
                <p
                  className="text-white/70 text-xs sm:text-sm leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer select-text"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(anime.description) }}
                />
              </div>
            )}
          </div>

          {/* Interactive Season Progress Tracking Bar */}
          {!isMovie && (
            <div className="bg-kuro-surface/75 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-magenta-400">
                      Season {selectedSeason} Progress
                    </span>
                    <span className="text-xs font-bold text-white/60">
                      ({watchedCount} of {episodeCount} Watched • {seasonProgressPercent}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full sm:max-w-md h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-magenta-500 to-pink-400 transition-all duration-500 shadow-[0_0_12px_rgba(255,42,133,0.6)]"
                      style={{ width: `${seasonProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      markSeasonCompleted(
                        anime.id,
                        title,
                        anime.coverImage?.large || "",
                        episodeCount,
                        selectedSeason
                      )
                    }
                    className="text-xs font-bold flex items-center gap-1.5 hover:border-magenta-500 hover:text-magenta-400 transition-all"
                  >
                    <CheckCheck size={15} className="text-magenta-400" />
                    <span>Mark Season Completed</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resetSeasonProgress(anime.id, episodeCount, selectedSeason)}
                    className="text-xs font-bold text-white/60 hover:text-white flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Anime ("More Like This") */}
          {recommendations.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <DualToneHeading
                  as="h2"
                  text="More Like This"
                  className="text-xl sm:text-2xl font-black tracking-tight"
                />
                <span className="text-xs font-mono font-bold text-white/50">
                  {recommendations.length} Recommended
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                {recommendations.slice(0, 12).map((rec, i) => (
                  <AnimeCard key={rec.id} anime={rec as AniListMedia} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ─── Floating Draggable Mini-Player (Picture-in-Picture) ────────── */}
      <AnimatePresence>
        {isFloatingPip && streamIds?.primaryId && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-72 sm:w-80 md:w-96 rounded-2xl bg-black border-2 border-magenta-500/70 shadow-[0_15px_40px_rgba(0,0,0,0.95),0_0_25px_rgba(255,42,133,0.35)] backdrop-blur-xl overflow-hidden cursor-grab active:cursor-grabbing"
          >
            {/* Header / Drag handle */}
            <div className="flex items-center justify-between px-3 py-2 bg-kuro-surface/95 border-b border-white/10 select-none">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="w-2 h-2 rounded-full bg-magenta-500 animate-ping" />
                <p className="text-xs font-black text-white truncate">
                  {title} <span className="text-magenta-400 font-mono">EP {episode}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setManualPip(false);
                    setDismissedPip(false);
                    playerContainerRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Expand to Full Player"
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Maximize2 size={13} />
                </button>
                <button
                  onClick={() => {
                    setDismissedPip(true);
                    setManualPip(false);
                  }}
                  title="Close Mini-Player"
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Embedded Iframe in Mini-Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={getEmbedUrl("vidrock", streamId, selectedSeason, episode, isMovie)}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Mini Footer Controls */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-kuro-surface/90 border-t border-white/10 text-[11px]">
              <span className="text-white/60 font-semibold">
                {isMovie ? "Movie" : `S${selectedSeason} • Ep ${episode}`}
              </span>
              <div className="flex items-center gap-2.5">
                {hasPrev && (
                  <button
                    onClick={() => goToEpisode(episode - 1)}
                    className="text-white/70 hover:text-white font-bold transition-colors"
                  >
                    Prev
                  </button>
                )}
                {hasNext && (
                  <button
                    onClick={() => goToEpisode(episode + 1)}
                    className="text-magenta-400 hover:text-magenta-300 font-bold transition-colors"
                  >
                    Next Ep →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Drawer / Sidebar */}
      <AnimatePresence>
        {showEpisodeList && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEpisodeList(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-kuro-surface border-l border-white/10 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <List size={18} className="text-magenta-400" />
                  <span className="font-bold text-white text-sm">Episodes</span>
                  <span className="text-xs text-white/50">({episodeCount})</span>
                </div>
                <button
                  onClick={() => setShowEpisodeList(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-kuro-text-dim hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Season Selector in Drawer */}
              {availableSeasons.length > 1 && (
                <div className="p-3 border-b border-white/10 bg-black/40">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-white/70">Season:</span>
                    <div className="relative inline-flex items-center">
                      <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonSelect(Number(e.target.value))}
                        className="appearance-none bg-kuro-card text-white border border-white/15 focus:border-magenta-500 text-xs font-bold px-3 py-1.5 pr-7 rounded-lg cursor-pointer focus:outline-none"
                      >
                        {availableSeasons.map((s) => (
                          <option key={s.season_number} value={s.season_number} className="bg-black text-white">
                            {s.name || `Season ${s.season_number}`} {s.episode_count ? `(${s.episode_count} eps)` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-magenta-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1">
                    {availableSeasons.map((s) => {
                      const isActive = selectedSeason === s.season_number;
                      return (
                        <button
                          key={s.season_number}
                          onClick={() => handleSeasonSelect(s.season_number)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border transition-all",
                            isActive
                              ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-sm"
                              : "bg-white/[0.04] border-white/10 text-white/70 hover:text-white"
                          )}
                        >
                          {s.name || `S${s.season_number}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {loadingEpisodes ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50">
                    <div className="w-6 h-6 rounded-full border-2 border-magenta-500 border-t-transparent animate-spin" />
                    <span className="text-xs">Loading episodes...</span>
                  </div>
                ) : (
                  Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => {
                    const tmdbEp = tmdbEpisodes.find((e) => e.episode_number === ep);
                    const epTitle = tmdbEp?.name ?? `Episode ${ep}`;
                    const stillUrl = tmdbEp?.still_path
                      ? `https://image.tmdb.org/t/p/w300${tmdbEp.still_path}`
                      : anime.bannerImage || anime.coverImage?.large;
                    const watched = isEpisodeWatched(anime.id, ep, selectedSeason);
                    const prog = getProgress(anime.id, ep, selectedSeason);

                    return (
                      <div
                        key={`${selectedSeason}-${ep}`}
                        onClick={() => {
                          setShowEpisodeList(false);
                          goToEpisode(ep, selectedSeason);
                        }}
                      >
                        <EpisodeCard
                          episodeNum={ep}
                          season={selectedSeason}
                          title={epTitle}
                          thumbnail={stillUrl}
                          animeId={anime.id}
                          isActive={ep === episode}
                          isWatched={watched}
                          progress={prog}
                          fillerStatus={getEpisodeFillerStatus(title, ep)}
                          onToggleWatched={() =>
                            toggleEpisodeWatched(
                              anime.id,
                              ep,
                              title,
                              anime.coverImage?.large || "",
                              selectedSeason
                            )
                          }
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>





      {/* ─── KuroSync Watch Party Modal ───────────────────────────────── */}
      <WatchPartyModal
        isOpen={showPartyModal}
        onClose={() => setShowPartyModal(false)}
        animeId={anime.id}
        animeTitle={title}
        episode={episode}
      />
    </div>
  );
}
