"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Play, Star, Bookmark, Check, Sparkles } from "lucide-react";
import { cn, formatScore, getAnimeTitle } from "@/lib/utils";
import { useMyList } from "@/lib/store/useMyList";
import { useToast } from "@/lib/store/useToast";
import { useMoodRing } from "@/lib/store/useMoodRing";
import type { AniListMedia } from "@/lib/types";

interface AnimeCardProps {
  anime: AniListMedia;
  rank?: number;
  showProgress?: boolean;
  progress?: number;
  className?: string;
  index?: number;
}

export function AnimeCard({
  anime,
  rank,
  showProgress = false,
  progress = 0,
  className,
  index = 0,
}: AnimeCardProps) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const { isInList, addToList, removeFromList } = useMyList();
  const { success, info } = useToast();
  const { previewMoodFromGenres, clearPreview } = useMoodRing();

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── 3D Holographic Tilt Physics ──────────────────────────────────────────
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateXSpring = useSpring(useTransform(y, [0, 1], [10, -10]), {
    stiffness: 260,
    damping: 24,
  });
  const rotateYSpring = useSpring(useTransform(x, [0, 1], [-10, 10]), {
    stiffness: 260,
    damping: 24,
  });

  const title = getAnimeTitle(anime.title);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    x.set(xPct);
    y.set(yPct);
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    previewMoodFromGenres(anime.genres, title);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    clearPreview();
    x.set(0.5);
    y.set(0.5);
  };

  const score = formatScore(anime.averageScore);
  const coverUrl = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const inList = mounted && isInList(anime.id);
  const firstGenre = anime.genres?.[0];

  // Match score estimation
  const matchPercent = anime.averageScore ? Math.min(Math.round(anime.averageScore + 8), 99) : 95;

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inList) {
      removeFromList(anime.id);
      info(`Removed "${title}" from your list`);
    } else {
      addToList({
        id: anime.id,
        title,
        coverImage: coverUrl ?? "",
        genres: anime.genres ?? [],
        averageScore: anime.averageScore,
        episodes: anime.episodes,
        status: anime.status,
      });
      success(`Saved "${title}" to your list!`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
      style={{ perspective: 1000 }}
      className={cn("group relative flex-shrink-0 select-none", className)}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: "preserve-3d",
        }}
        className="relative transition-shadow duration-300"
      >
        <Link href={`/anime/${anime.id}`} className="block">
          {/* Card container with modern border glow */}
          <div className="relative overflow-hidden rounded-2xl bg-kuro-card/85 border border-white/[0.08] hover:border-magenta-500/80 transition-all duration-300 shadow-lg group-hover:shadow-[0_20px_40px_rgba(255,42,133,0.3)] cursor-pointer">
            {/* Rank badge */}
            {rank !== undefined && (
              <div className="absolute top-0 left-0 z-20">
                <div className="bg-magenta-500 text-white text-[11px] font-black px-2.5 py-1 rounded-br-xl rounded-tl-2xl shadow-[0_0_15px_rgba(255,42,133,0.6)]">
                  #{rank}
                </div>
              </div>
            )}

            {/* Quick Bookmark Button (Top Corner) */}
            <button
              onClick={handleBookmarkToggle}
              title={inList ? "Remove from List" : "Save to List"}
              className={cn(
                "absolute top-2.5 z-30 p-2 rounded-xl backdrop-blur-xl border transition-all duration-200",
                rank !== undefined ? "right-2.5" : "left-2.5",
                inList
                  ? "bg-magenta-500 text-white border-magenta-500 shadow-[0_0_15px_rgba(255,42,133,0.6)] scale-100"
                  : "bg-black/60 border-white/10 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/90 hover:scale-110"
              )}
            >
              {inList ? <Check size={14} className="stroke-[3]" /> : <Bookmark size={14} />}
            </button>

            {/* ─── Dynamic Holographic Specular Sheen ────────────────────── */}
            <div
              className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
              style={{
                background: isHovered
                  ? `radial-gradient(420px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(255, 42, 133, 0.32), rgba(255, 255, 255, 0.15), transparent 65%)`
                  : undefined,
              }}
            />

            {/* Cover Image Container */}
            <div className="relative aspect-[2/3] overflow-hidden bg-kuro-surface">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="w-full h-full bg-kuro-surface flex items-center justify-center">
                  <span className="text-kuro-muted text-xs">No Image</span>
                </div>
              )}

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-300" />

              {/* Always Visible Glass Rating Pill */}
              {anime.averageScore && (
                <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-2 py-0.5 shadow-sm">
                  <Star size={11} className="text-magenta-400 fill-magenta-400" />
                  <span className="text-[11px] font-black text-white">{score}</span>
                </div>
              )}

              {/* Quick Play Action Circle on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                <div className="w-12 h-12 rounded-full bg-magenta-500 flex items-center justify-center shadow-[0_0_30px_rgba(255,42,133,0.9)] scale-75 group-hover:scale-100 transition-transform duration-300">
                  <Play size={18} className="text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Watch Progress bar */}
              {showProgress && progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20">
                  <div
                    className="h-full bg-magenta-500 shadow-[0_0_10px_rgba(255,42,133,0.8)] transition-all"
                    style={{ width: `${Math.min(progress * 100, 100)}%` }}
                  />
                </div>
              )}

              {/* Quick-Action Floating Pill on Hover */}
              <div className="absolute bottom-2 left-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 shadow-[0_10px_25px_rgba(0,0,0,0.9),0_0_15px_rgba(255,42,133,0.35)]">
                  <Link
                    href={`/watch/${anime.id}/1`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-magenta-500 hover:bg-magenta-400 text-white text-[10px] font-black transition-all shadow-[0_0_10px_rgba(255,42,133,0.6)]"
                  >
                    <Play size={10} className="fill-white" />
                    <span>Play S1E1</span>
                  </Link>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-magenta-400">
                      {matchPercent}%
                    </span>
                    <Sparkles size={10} className="text-magenta-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Meta Info */}
            <div className="p-3">
              <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-magenta-400 transition-colors">
                {title}
              </h3>

              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {anime.format && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-white/[0.06] border border-white/[0.08] text-kuro-text-dim">
                    {anime.format.replace("_", " ")}
                  </span>
                )}
                {firstGenre && (
                  <span className="text-[10px] font-medium text-kuro-muted truncate max-w-[80px]">
                    {firstGenre}
                  </span>
                )}
                {anime.episodes && (
                  <span className="text-[10px] font-medium text-kuro-muted ml-auto">
                    {anime.episodes} eps
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
