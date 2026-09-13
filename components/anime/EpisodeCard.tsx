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
  onToggleWatched,
}: EpisodeCardProps) {
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
