"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  ChevronLeft,
  Copy,
  Check,
  Crown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sparkles,
  Tv,
  MessageSquare,
  Flame,
  Radio,
  Share2,
} from "lucide-react";
import VidRockPlayer from "@/components/player/VidRockPlayer";
import { BulletReactionsOverlay } from "@/components/party/BulletReactionsOverlay";
import { PartyChatDrawer } from "@/components/party/PartyChatDrawer";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { Button } from "@/components/ui/Button";
import { useKuroSync } from "@/lib/store/useKuroSync";
import { useToast } from "@/lib/store/useToast";
import { useMoodRing } from "@/lib/store/useMoodRing";
import { resolveStreamIds, type StreamIds } from "@/lib/api/tmdb";
import { getAnimeById } from "@/lib/api/anilist";
import { getAnimeTitle, cn } from "@/lib/utils";

interface PartyClientProps {
  roomId: string;
}

export function PartyClient({ roomId }: PartyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animeIdParam = searchParams.get("anime");
  const epParam = searchParams.get("ep");
  const isHostParam = searchParams.get("host") === "1";

  const targetAnimeId = animeIdParam ? parseInt(animeIdParam) : 16498;
  const initialEpisode = epParam ? Math.max(1, parseInt(epParam)) : 1;

  const {
    currentUser,
    activeUsers,
    anime,
    isPlaying,
    initRoom,
    setPlayback,
    setEpisode,
    leaveRoom,
  } = useKuroSync();

  const { success, info } = useToast();
  const { setMoodFromGenres } = useMoodRing();

  const [streamIds, setStreamIds] = useState<StreamIds | null>(null);
  const [loadingStream, setLoadingStream] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatOpenOnMobile, setChatOpenOnMobile] = useState(false);
  const [animeData, setAnimeData] = useState<any>(null);

  // Initialize party room
  useEffect(() => {
    let active = true;

    async function setup() {
      try {
        const res = await getAnimeById(targetAnimeId);
        if (!active) return;
        const media = res.Media;
        setAnimeData(media);
        setMoodFromGenres(media.genres, getAnimeTitle(media.title));

        initRoom(
          roomId,
          undefined,
          {
            id: media.id,
            title: getAnimeTitle(media.title),
            coverImage: media.coverImage?.large,
            episode: initialEpisode,
            totalEpisodes: media.episodes ?? undefined,
          },
          isHostParam
        );
      } catch {
        if (!active) return;
        initRoom(
          roomId,
          undefined,
          {
            id: targetAnimeId,
            title: "Watch Party Stream",
            episode: initialEpisode,
          },
          isHostParam
        );
      }
    }

    setup();

    return () => {
      active = false;
    };
  }, [roomId, targetAnimeId, initialEpisode, isHostParam]);

  // Resolve stream when anime or episode updates
  const currentEp = anime?.episode || initialEpisode;

  useEffect(() => {
    let cancelled = false;
    setLoadingStream(true);

    async function fetchStream() {
      try {
        const ids = await resolveStreamIds(
          targetAnimeId,
          animeData?.title?.english || animeData?.title?.romaji || "Anime"
        );
        if (!cancelled) {
          setStreamIds(ids);
          setLoadingStream(false);
        }
      } catch (err) {
        if (!cancelled) setLoadingStream(false);
      }
    }

    if (animeData) {
      fetchStream();
    } else {
      resolveStreamIds(targetAnimeId, "Anime").then((ids) => {
        if (!cancelled) {
          setStreamIds(ids);
          setLoadingStream(false);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [targetAnimeId, animeData, currentEp]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      success("Invite link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const isHost = currentUser?.isHost || isHostParam;

  const handleNextEp = () => {
    if (!isHost) {
      info("Only the party host can change episodes!");
      return;
    }
    setEpisode(currentEp + 1);
  };

  const handlePrevEp = () => {
    if (!isHost) {
      info("Only the party host can change episodes!");
      return;
    }
    if (currentEp > 1) {
      setEpisode(currentEp - 1);
    }
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-28 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col">
      {/* Top Bar Navigation & Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/party"
            onClick={leaveRoom}
            className="flex items-center gap-1.5 text-xs text-kuro-lavender/70 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Leave Party</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-wider">
              <Radio className="w-3 h-3 animate-pulse text-red-400" />
              LIVE SYNC
            </span>
            <span className="text-xs font-mono text-white/90 bg-white/5 px-2 py-1 rounded border border-white/10">
              #{roomId}
            </span>
            {isHost && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                <Crown className="w-3 h-3 text-amber-400" /> Host
              </span>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Copied!" : "Invite Friends"}</span>
          </Button>

          {/* Toggle Chat button for Mobile */}
          <button
            onClick={() => setChatOpenOnMobile(!chatOpenOnMobile)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-kuro-card border border-white/10 text-xs text-white"
          >
            <MessageSquare className="w-3.5 h-3.5 text-kuro-magenta" />
            <span>Chat ({activeUsers.length})</span>
          </button>
        </div>
      </div>

      {/* Main Party Room Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
        {/* Left / Center: Video Player (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col justify-start">
          {loadingStream ? (
            <div className="w-full aspect-video rounded-3xl bg-kuro-card/80 border border-white/10 flex flex-col items-center justify-center text-kuro-lavender/60">
              <Sparkles className="w-8 h-8 text-kuro-magenta animate-spin mb-3" />
              <p className="text-xs font-mono">Syncing stream connection...</p>
            </div>
          ) : (
            <VidRockPlayer
              tmdbId={streamIds?.tmdbId}
              imdbId={streamIds?.imdbId}
              season={1}
              episode={currentEp}
              title={anime?.title || "Anime"}
              hasNext={true}
              hasPrev={currentEp > 1}
              onNextEpisode={handleNextEp}
              onPrevEpisode={handlePrevEp}
              overlay={<BulletReactionsOverlay />}
            />
          )}
        </div>

        {/* Right: Live Chat & Reactions Drawer (4 cols on lg) */}
        <div
          className={cn(
            "lg:col-span-4 flex flex-col min-h-[520px] lg:min-h-0",
            chatOpenOnMobile ? "block" : "hidden lg:flex"
          )}
        >
          <PartyChatDrawer className="h-full" />
        </div>
      </div>
    </div>
  );
}
