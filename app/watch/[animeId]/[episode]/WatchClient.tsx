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
  Sparkles,
  Play,
  ShieldCheck,
  ShieldAlert,
  FastForward,
  Swords,
  BookOpen,
  Lock,
  Unlock,
  Users,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import VidRockPlayer from "@/components/player/VidRockPlayer";
import { NativeHlsPlayer } from "@/components/player/NativeHlsPlayer";
import { EpisodeCard } from "@/components/anime/EpisodeCard";
import { Button } from "@/components/ui/Button";
import { WatchPartyModal } from "@/components/party/WatchPartyModal";
import { useWatchHistory, getPlaybackTimestamp, formatTimestamp } from "@/lib/store/useWatchHistory";
import { useMoodRing } from "@/lib/store/useMoodRing";
import { getAnimeTitle, cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { getEpisodeFillerStatus, getNextCanonEpisode } from "@/lib/utils/fillerData";
import { getAnimeLoreCodex } from "@/lib/utils/loreCodex";
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
  const [customStreamInput, setCustomStreamInput] = useState("");

  // Picture-in-Picture & Floating Mini-Player & Cinema Mode state
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const [manualPip, setManualPip] = useState(false);
  const [dismissedPip, setDismissedPip] = useState(false);
  const [resumeTimestamp, setResumeTimestamp] = useState<string | null>(null);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // Smart Canon & Filler Shield state
  const [skipFillerMode, setSkipFillerMode] = useState(true);

  // Context-Aware Lore Codex state
  const [showLoreCodex, setShowLoreCodex] = useState(false);
  const [revealSpoilers, setRevealSpoilers] = useState(false);

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
  const loreData = getAnimeLoreCodex(title);
  const nextCanonEpisodeNum = getNextCanonEpisode(title, episode);
  const nextFillerStatus = getEpisodeFillerStatus(title, episode + 1);
  const isNextFiller = nextFillerStatus.isFiller;

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
          if (data.directUrl) {
            setDirectStreamUrl(data.directUrl);
            setPlayerMode("native");
          } else {
            setDirectStreamUrl(null);
            setPlayerMode("mirror");
          }
        }
      } catch (err) {
        console.warn("Direct HLS stream unavailable, falling back to embed mirrors:", err);
        if (isMounted) {
          setDirectStreamUrl(null);
          setPlayerMode("mirror");
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

  // ─── Global Keyboard Shortcuts for Next-Gen Streaming ────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setIsCinemaMode((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isCinemaMode) {
          e.preventDefault();
          setIsCinemaMode(false);
        }
      } else if (e.key === "f" || e.key === "F") {
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
  }, [isCinemaMode, hasNext, hasPrev, handleNext, handlePrev]);

  const handleSeasonSelect = (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    router.push(`/watch/${anime.id}/1?season=${seasonNum}`);
  };

  const streamId = streamIds?.tmdbId || streamIds?.imdbId || String(anime.id);

  return (
    <div className="min-h-screen bg-kuro-bg pb-28 sm:pb-24 pt-16 relative">
      {/* ─── Ambient Cinema Mode Dimming Overlay ───────────────────────── */}
      <AnimatePresence>
        {isCinemaMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setIsCinemaMode(false)}
            className="fixed inset-0 bg-black/94 backdrop-blur-lg z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* ─── Floating Cinema HUD & Shortcuts Legend ─────────────────────── */}
      <AnimatePresence>
        {isCinemaMode && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-black/90 backdrop-blur-2xl border border-magenta-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.95),0_0_25px_rgba(255,42,133,0.3)]"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-magenta-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-magenta-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Cinema Mode Active
              </span>
            </div>

            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            {/* Shortcut Legend */}
            <div className="hidden sm:flex items-center gap-3.5 text-[11px] text-white/70 font-semibold">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">C</kbd>
                <span>Cinema</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">F</kbd>
                <span>Fullscreen</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">N</kbd>
                <span>Next Ep</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">P</kbd>
                <span>Prev Ep</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</kbd>
                <span>Exit</span>
              </span>
            </div>

            <button
              onClick={() => setIsCinemaMode(false)}
              className="ml-1 text-xs font-black px-3.5 py-1.5 rounded-xl bg-magenta-500 text-white hover:bg-magenta-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,42,133,0.5)]"
            >
              Exit (Esc)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
          {/* Lore Codex Drawer Button */}
          <button
            onClick={() => setShowLoreCodex(true)}
            title="Open Spoiler-Protected Lore Codex"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-magenta-500/40 text-white/90 hover:text-white transition-all shadow-sm"
          >
            <BookOpen size={13} className="text-magenta-400" />
            <span className="hidden sm:inline">Lore Codex</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-magenta-500/20 text-magenta-300 font-bold hidden md:inline">
              Safe
            </span>
          </button>

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

          {/* Cinema Mode Switch in Breadcrumb */}
          <button
            onClick={() => setIsCinemaMode(!isCinemaMode)}
            title={isCinemaMode ? "Exit Cinema Mode (Esc / C)" : "Cinema Mode (C)"}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
              isCinemaMode
                ? "bg-magenta-500 text-white border-magenta-500 shadow-[0_0_15px_rgba(255,42,133,0.6)] animate-pulse"
                : "bg-white/[0.04] border-white/15 text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            <Sparkles size={14} className={isCinemaMode ? "fill-white" : "text-magenta-400"} />
            <span className="hidden sm:inline">{isCinemaMode ? "Exit Cinema" : "Cinema Mode"}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-white/15 text-white font-mono hidden md:inline">C</span>
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

      {/* Main player area */}
      <div className={cn(
        "px-4 sm:px-6 md:px-12 py-6 mx-auto space-y-6 transition-all duration-500",
        isCinemaMode ? "max-w-[1440px] relative z-50" : "max-w-7xl"
      )}>
        <div ref={playerContainerRef} className={cn("transition-all duration-500", isCinemaMode ? "scale-[1.02]" : "")}>
          {/* Player Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlayerMode("native")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                  playerMode === "native"
                    ? "bg-magenta-500 text-white border-magenta-500 shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                    : "bg-white/[0.04] text-white/70 hover:text-white border-white/10 hover:border-magenta-500/30"
                )}
              >
                <Zap size={13} className={playerMode === "native" ? "fill-white" : "text-magenta-400"} />
                <span>Native HLS</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-black bg-white/20">Direct</span>
              </button>

              <button
                type="button"
                onClick={() => setPlayerMode("mirror")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                  playerMode === "mirror"
                    ? "bg-white/20 text-white border-white/40 shadow-sm"
                    : "bg-white/[0.04] text-white/70 hover:text-white border-white/10 hover:border-white/30"
                )}
              >
                <Tv size={13} className="text-white/80" />
                <span>Embed Mirrors</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono text-white/60 bg-white/10">VidRock / Multi</span>
              </button>
            </div>

            {/* Status indicator */}
            <div className="text-[11px] text-kuro-muted hidden sm:flex items-center gap-2">
              {resolvingDirectStream ? (
                <span className="flex items-center gap-1.5 text-magenta-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-magenta-400" />
                  Resolving direct stream...
                </span>
              ) : directStreamUrl ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Direct HLS ready • No popups
                </span>
              ) : playerMode === "native" ? (
                <span className="text-magenta-400">Native HLS Mode Active</span>
              ) : (
                <span className="text-white/40">Using Embed Mirrors (VidRock)</span>
              )}
            </div>
          </div>

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
              onToggleCinema={() => setIsCinemaMode((prev) => !prev)}
              isCinemaMode={isCinemaMode}
              onFallbackToMirror={() => setPlayerMode("mirror")}
              jumpToTime={jumpTimeTarget}
            />
          ) : playerMode === "native" && !directStreamUrl ? (
            <div className="w-full aspect-video rounded-2xl bg-kuro-surface/90 border border-white/10 flex flex-col items-center justify-center text-center p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-magenta-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10 max-w-lg space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-magenta-500/15 border border-magenta-500/30 flex items-center justify-center text-magenta-400 shadow-[0_0_20px_rgba(255,42,133,0.3)]">
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Native HLS Direct Player</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Direct automated .m3u8 is not yet cached for this episode on public CDNs. You can play a 1080p demo stream to experience the custom player, paste a custom .m3u8, or switch to Embed Mirrors.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDirectStreamUrl("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-magenta-500 hover:bg-magenta-400 text-white shadow-[0_0_15px_rgba(255,42,133,0.5)] active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Play 1080p Demo Stream</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlayerMode("mirror")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Tv size={14} />
                    <span>Switch to Embed Mirrors</span>
                  </button>
                </div>

                {/* Custom .m3u8 input */}
                <div className="pt-3 border-t border-white/10 flex items-center gap-2 max-w-md mx-auto">
                  <input
                    type="url"
                    placeholder="Or paste custom .m3u8 URL..."
                    value={customStreamInput}
                    onChange={(e) => setCustomStreamInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-magenta-500/60"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customStreamInput.trim()) {
                        setDirectStreamUrl(customStreamInput.trim());
                      }
                    }}
                    disabled={!customStreamInput.trim()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-magenta-500 text-white border border-white/15 disabled:opacity-40 transition-all"
                  >
                    Play
                  </button>
                </div>
              </div>
            </div>
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
              isCinemaMode={isCinemaMode}
              onToggleCinema={() => setIsCinemaMode((prev) => !prev)}
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

        {/* ─── ⚔️ Smart Episode Timeline Chapters & Action Control Bar ─────── */}
        <div className="bg-kuro-surface/85 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mr-1">
              <FastForward size={14} className="text-magenta-400" />
              <span>Smart Skip:</span>
            </span>

            {/* Skip Intro */}
            <button
              onClick={() => handleJumpTimestamp(90)}
              title="Skip Opening Theme (+90 seconds)"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-magenta-500/20 border border-white/10 hover:border-magenta-500/40 text-white/90 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Skip OP (+90s)</span>
            </button>

            {/* Skip Recap */}
            <button
              onClick={() => handleJumpTimestamp(150)}
              title="Skip Recap (+150 seconds)"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-magenta-500/20 border border-white/10 hover:border-magenta-500/40 text-white/90 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Skip Recap (+2.5m)</span>
            </button>

            {/* Jump to Climax Fight */}
            <button
              onClick={() => handleJumpTimestamp(840)}
              title="Jump to Climax Battle (~14:00)"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-magenta-500/15 hover:bg-magenta-500/30 border border-magenta-500/40 text-magenta-300 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,42,133,0.25)] active:scale-95"
            >
              <Swords size={13} className="text-magenta-400" />
              <span>Jump to Fight</span>
            </button>
          </div>

          {/* Smart Canon Shield Status Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSkipFillerMode(!skipFillerMode)}
              title={skipFillerMode ? "Skip Filler Mode ON: Automatically skips non-canon episodes" : "Skip Filler Mode OFF"}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm active:scale-95",
                skipFillerMode
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-white/[0.04] border-white/10 text-white/50"
              )}
            >
              {skipFillerMode ? <ShieldCheck size={14} className="text-emerald-400" /> : <ShieldAlert size={14} />}
              <span>{skipFillerMode ? "Canon Shield: ON" : "Canon Shield: OFF"}</span>
            </button>

            <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md border", currentFillerStatus.badgeColor, currentFillerStatus.textColor)}>
              {currentFillerStatus.label}
            </span>
          </div>
        </div>

        {/* ─── Interactive Season Progress Tracking Bar ────────────────── */}
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

        {/* Anime metadata card below player */}
        <div className="bg-kuro-surface/60 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
              <div className="flex items-center gap-2 text-xs text-kuro-text-dim flex-wrap">
                {anime.format && (
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white">
                    {anime.format}
                  </span>
                )}
                {anime.seasonYear && <span className="text-white/80">{anime.seasonYear}</span>}
                {anime.averageScore && (
                  <span className="text-magenta-400 font-bold flex items-center gap-1">
                    <Star size={12} className="fill-magenta-400 text-magenta-400" />
                    {(anime.averageScore / 10).toFixed(1)}
                  </span>
                )}
                {anime.status && (
                  <span className="text-magenta-400 font-semibold">{anime.status.replace("_", " ")}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/anime/${anime.id}`}>
                <Button size="sm" variant="ghost" className="text-xs text-white/80 hover:text-white">
                  <Info size={14} className="mr-1.5" />
                  View Details & Cast
                </Button>
              </Link>
            </div>
          </div>

          {/* Synopsis */}
          {anime.description && (
            <p
              className="text-white/70 text-sm mt-4 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(anime.description) }}
            />
          )}
        </div>

        {/* ─── Inline Season Episodes Grid ─────────────────────────────── */}
        {!isMovie && (
          <div className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <List size={18} className="text-magenta-400" />
                <h3 className="text-base font-black text-white">
                  Season {selectedSeason} Episodes
                </h3>
                <span className="text-xs font-bold text-white/40">({episodeCount} eps)</span>
              </div>

              {/* Season switcher pills */}
              {availableSeasons.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1">
                  {availableSeasons.map((s) => {
                    const isActive = selectedSeason === s.season_number;
                    return (
                      <button
                        key={s.season_number}
                        onClick={() => handleSeasonSelect(s.season_number)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all",
                          isActive
                            ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-[0_0_12px_rgba(255,42,133,0.45)]"
                            : "bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]"
                        )}
                      >
                        {s.name || `Season ${s.season_number}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {loadingEpisodes ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50">
                <div className="w-6 h-6 rounded-full border-2 border-magenta-500 border-t-transparent animate-spin" />
                <span className="text-xs">Loading season episodes...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
        )}
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



      {/* ─── 📜 Context-Aware Lore Codex Drawer ─────────────────────────── */}
      <AnimatePresence>
        {showLoreCodex && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoreCodex(false)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#0e0e14]/98 border-l border-magenta-500/30 flex flex-col shadow-2xl overflow-hidden backdrop-blur-2xl"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-magenta-500/20 text-magenta-400 border border-magenta-500/30">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>Lore Codex & Intel</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-magenta-500 text-white font-mono">
                        Ep {episode} Safe
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/50">{title}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowLoreCodex(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Spoiler Shield Status Bar */}
              <div className="px-4 py-2.5 bg-magenta-500/10 border-b border-magenta-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-magenta-400 font-bold">
                  {revealSpoilers ? <Unlock size={13} /> : <Lock size={13} />}
                  <span>{revealSpoilers ? "Spoiler Shield: OFF" : `Spoiler Shield: Active (Locked > Ep ${episode})`}</span>
                </div>
                <button
                  onClick={() => setRevealSpoilers((prev) => !prev)}
                  className="text-[10px] font-mono font-bold text-white/70 hover:text-white underline"
                >
                  {revealSpoilers ? "Hide Spoilers" : "Reveal All"}
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* Power System Section */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-magenta-400">
                    <Sparkles size={13} />
                    <span>Power System: {loreData.powerSystem.name}</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {loreData.powerSystem.description}
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {loreData.powerSystem.rules.map((rule, idx) => (
                      <li key={idx} className="text-[11px] text-white/60 flex items-start gap-1.5">
                        <span className="text-magenta-400 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Character Dossiers */}
                <div className="space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center gap-2">
                    <Swords size={13} className="text-magenta-400" />
                    <span>Key Character Dossiers</span>
                  </div>

                  {loreData.characters.map((char) => {
                    const isLocked = !revealSpoilers && char.spoilerPastEpisode && episode < char.spoilerPastEpisode;

                    return (
                      <div
                        key={char.name}
                        className="rounded-2xl bg-black/40 border border-white/10 p-3.5 space-y-2.5 transition-all hover:border-white/20"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-kuro-card flex-shrink-0 border border-white/10 relative">
                              <Image
                                src={char.avatar}
                                alt={char.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-white">{char.name}</h4>
                              <p className="text-[10px] text-magenta-400 font-medium">{char.affiliation}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/80">
                            {char.role}
                          </span>
                        </div>

                        {/* Bio (Clean vs Classified) */}
                        <p className="text-xs text-white/70 leading-relaxed">
                          {char.cleanBio}
                        </p>

                        {/* Classified Spoiler Area */}
                        {char.classifiedBio && (
                          <div className={cn(
                            "p-2.5 rounded-xl text-xs transition-all relative overflow-hidden",
                            isLocked
                              ? "bg-red-500/10 border border-red-500/20 text-red-300"
                              : "bg-magenta-500/10 border border-magenta-500/30 text-white/80"
                          )}>
                            {isLocked ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                                  <Lock size={12} className="text-red-400" />
                                  <span>Classified Intel (Unlocks at Ep {char.spoilerPastEpisode})</span>
                                </div>
                                <button
                                  onClick={() => setRevealSpoilers(true)}
                                  className="text-[10px] text-red-400 hover:underline font-bold"
                                >
                                  Reveal
                                </button>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[10px] font-mono font-bold text-magenta-400 flex items-center gap-1 mb-1">
                                  <Zap size={11} className="fill-magenta-400 text-magenta-400" />
                                  UNLOCKED INTEL:
                                </span>
                                <p className="text-[11px] text-white/70">{char.classifiedBio}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Powers */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {char.powers.map((p) => (
                            <span
                              key={p}
                              className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-white/60 border border-white/5"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
