"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FillerStatus } from "@/lib/utils/fillerData";

interface EpisodeCardProps {
  animeId: number;
  episodeNum: number;
  season?: number;
  thumbnail?: string;
  isActive?: boolean;
  isWatched?: boolean;
  progress?: number;
  title?: string;
  fillerStatus?: FillerStatus;
  className?: string;
  variant?: "grid" | "compact";
  onToggleWatched?: (e: React.MouseEvent) => void;
}

export function EpisodeCard({
  animeId,
  episodeNum,
  season = 1,
  thumbnail,
  isActive = false,
  isWatched = false,
  progress = 0,
  title,
  fillerStatus,
  className,
  variant = "grid",
  onToggleWatched,
}: EpisodeCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/watch/${animeId}/${episodeNum}?season=${season}`} className="block">
        <div
          className={cn(
            "group relative rounded-xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.06] border transition-all duration-200 flex items-center gap-2.5 p-1.5 cursor-pointer",
            isActive
              ? "bg-magenta-500/10 border-magenta-500/60 shadow-[0_0_15px_rgba(255,42,133,0.3)]"
              : "border-white/5 hover:border-white/15",
            className
          )}
        >
          {/* Compact Thumbnail */}
          <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-kuro-surface flex-shrink-0 border border-white/10">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={`Episode ${episodeNum}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="120px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-kuro-surface to-kuro-card">
                <span className="text-sm font-mono font-black text-white/30">{episodeNum}</span>
              </div>
            )}

            {/* Episode Pill */}
            <span className="absolute bottom-1 left-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-black/80 backdrop-blur-md text-white border border-white/10">
              EP {episodeNum}
            </span>

            {/* Active glowing indicator */}
            {isActive && (
              <div className="absolute inset-0 bg-magenta-500/20 flex items-center justify-center">
                <Play size={14} className="text-white fill-white ml-0.5" />
              </div>
            )}
          </div>

          {/* Episode Info */}
          <div className="flex-1 min-w-0 pr-1">
            <p
              className={cn(
                "text-xs font-semibold truncate transition-colors",
                isActive ? "text-magenta-400 font-bold" : "text-white/90 group-hover:text-white"
              )}
            >
              {title || `Episode ${episodeNum}`}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-white/45">
              <span>Sub • Dub</span>
              {fillerStatus && (
                <span className={cn("font-bold px-1 rounded border", fillerStatus.badgeColor, fillerStatus.textColor)}>
                  {fillerStatus.label}
                </span>
              )}
            </div>
          </div>

          {/* Right Status */}
          <div className="flex items-center pr-1 flex-shrink-0">
            {isActive ? (
              <span className="w-2 h-2 rounded-full bg-magenta-500 shadow-[0_0_8px_rgba(255,42,133,0.9)] animate-pulse" />
            ) : isWatched ? (
              <CheckCircle size={14} className="text-magenta-400/80" />
            ) : null}
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link href={`/watch/${animeId}/${episodeNum}?season=${season}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative rounded-xl overflow-hidden bg-kuro-card border cursor-pointer transition-all duration-200",
          isActive
            ? "border-magenta-500 shadow-[0_0_15px_rgba(255,42,133,0.45)]"
            : "border-white/10 hover:border-magenta-500/60",
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-kuro-surface">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={`Episode ${episodeNum}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-kuro-surface to-kuro-card">
              <span className="text-3xl font-display font-black text-magenta-500/20">
                {episodeNum}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-magenta-500 rounded-full p-3 shadow-[0_0_15px_rgba(255,42,133,0.6)]">
              <Play size={16} className="text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Active indicator */}
          {isActive && (
            <div className="absolute top-2 left-2 z-10 bg-magenta-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              NOW PLAYING
            </div>
          )}

          {/* Canon / Filler Badge */}
          {fillerStatus && (
            <div
              className={cn(
                "absolute z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-md border shadow-sm",
                isActive ? "top-8 left-2" : "top-2 left-2",
                fillerStatus.badgeColor,
                fillerStatus.textColor
              )}
            >
              {fillerStatus.label}
            </div>
          )}

          {/* Watched badge or quick toggle */}
          {onToggleWatched ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWatched(e);
              }}
              title={isWatched ? "Mark Unwatched" : "Mark as Watched"}
              className={cn(
                "absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur-md border transition-all",
                isWatched
                  ? "bg-magenta-500 text-white border-magenta-500 shadow-sm"
                  : "bg-black/60 border-white/20 text-white/70 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-black/90"
              )}
            >
              <CheckCircle size={14} className={isWatched ? "stroke-[3]" : ""} />
            </button>
          ) : (
            isWatched && !isActive && (
              <div className="absolute top-2 right-2">
                <CheckCircle size={16} className="text-magenta-400 fill-magenta-400/20" />
              </div>
            )
          )}

          {/* Sub • Dub Quality Pill */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 z-10">
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-black/75 backdrop-blur-md border border-white/10 text-white">
              SUB • DUB
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-black/75 backdrop-blur-md border border-white/10 text-magenta-400">
              1080P
            </span>
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className="h-full bg-magenta-500 shadow-[0_0_8px_rgba(255,42,133,0.8)]"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Episode label */}
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-kuro-text-dim uppercase tracking-wide">
            Episode {episodeNum}
          </p>
          {title && (
            <p className="text-xs text-kuro-muted mt-0.5 truncate">{title}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
