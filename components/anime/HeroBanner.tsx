"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Info,
  Calendar,
  Tv,
  Star,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Check,
} from "lucide-react";
import { useMyList } from "@/lib/store/useMyList";
import { useToast } from "@/lib/store/useToast";
import { useMoodRing } from "@/lib/store/useMoodRing";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { getAnimeTitle, stripHtml, truncate, cn } from "@/lib/utils";
import type { AniListMedia } from "@/lib/types";

export interface HeroBannerProps {
  anime?: AniListMedia;
  animeList?: AniListMedia[];
}

export function HeroBanner({ anime, animeList }: HeroBannerProps) {
  const list =
    animeList && animeList.length > 0 ? animeList : anime ? [anime] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  const currentAnime = list[currentIndex] || anime;
  const title = currentAnime ? getAnimeTitle(currentAnime.title) : "";

  const { isInList, addToList, removeFromList } = useMyList();
  const { success, info } = useToast();
  const { setMoodFromGenres } = useMoodRing();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentAnime) setMoodFromGenres(currentAnime.genres, title);
  }, [currentAnime, title, setMoodFromGenres]);

  const nextSlide = useCallback(() => {
    if (list.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % list.length);
  }, [list.length]);

  const prevSlide = useCallback(() => {
    if (list.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  }, [list.length]);

  useEffect(() => {
    if (isPaused || list.length <= 1) return;
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, [isPaused, list.length, nextSlide]);

  if (!currentAnime) return null;

  const inList = mounted && isInList(currentAnime.id);

  const handleListToggle = () => {
    if (inList) {
      removeFromList(currentAnime.id);
      info(`Removed "${title}" from your list`);
    } else {
      addToList({
        id: currentAnime.id,
        title,
        coverImage: currentAnime.coverImage?.large ?? "",
        genres: currentAnime.genres ?? [],
        averageScore: currentAnime.averageScore ?? null,
        episodes: currentAnime.episodes ?? null,
        status: currentAnime.status ?? "",
      });
      success(`Added "${title}" to your list`);
    }
  };

  const synopsis = currentAnime.description
    ? truncate(stripHtml(currentAnime.description), 180)
    : "No synopsis available.";

  const bannerUrl =
    currentAnime.bannerImage ?? currentAnime.coverImage?.extraLarge;

  const seasonLabel = currentAnime.season
    ? `${currentAnime.season.charAt(0) + currentAnime.season.slice(1).toLowerCase()} ${currentAnime.seasonYear ?? ""}`.trim()
    : currentAnime.seasonYear
    ? String(currentAnime.seasonYear)
    : "";

  const score = currentAnime.averageScore
    ? (currentAnime.averageScore / 10).toFixed(1)
    : null;

  const statusText =
    currentAnime.status === "RELEASING"
      ? "RELEASING"
      : currentAnime.status === "FINISHED"
      ? "COMPLETED"
      : currentAnime.status?.replace("_", " ") || "AIRING";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[74vh] min-h-[540px] max-h-[760px] overflow-hidden bg-kuro-bg select-none"
    >
      {/* ── Backdrop Banner ── */}
      <AnimatePresence mode="wait">
        {bannerUrl && (
          <motion.div
            key={`bg-${currentAnime.id}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={bannerUrl}
              alt={title}
              fill
              priority
              className="object-cover object-[center_25%]"
              sizes="100vw"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cinematic Gradient Overlays (Magenta & Dark Kuro) ── */}
      {/* Dark fade from bottom to top */}
      <div className="absolute inset-0 bg-gradient-to-t from-kuro-bg via-kuro-bg/50 to-transparent" />
      {/* Dark fade from left for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-kuro-bg via-kuro-bg/75 via-40% to-transparent" />
      {/* Subtle top shadow so navbar is crystal clear */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-kuro-bg/80 to-transparent pointer-events-none" />

      {/* ── Bottom Magenta Accent Line ── */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-magenta-500/40 to-transparent pointer-events-none" />

      {/* ── Main Content Container ── */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 flex flex-col justify-end pb-10 sm:pb-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentAnime.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="max-w-2xl sm:max-w-3xl space-y-3 sm:space-y-4"
          >
            {/* Anime Title in Signature Shiny White & Magenta Dual-Tone */}
            <DualToneHeading
              text={title}
              className="text-3xl sm:text-5xl md:text-6xl font-black leading-[1.08] tracking-tight line-clamp-2"
            />

            {/* Metadata Strip — Strictly Magenta & White */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold flex-wrap">
              {/* Airing / Releasing Status Badge */}
              <span className="text-magenta-400 font-extrabold uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-magenta-400 animate-pulse inline-block" />
                {statusText}
              </span>

              {/* Rating */}
              {score && (
                <div className="flex items-center gap-1 text-white/90 font-bold">
                  <Star size={13} className="fill-magenta-400 text-magenta-400" />
                  <span>{score}</span>
                </div>
              )}

              {/* Season & Year */}
              {seasonLabel && (
                <div className="flex items-center gap-1.5 text-white/75 font-medium">
                  <Calendar size={14} className="text-white/40" />
                  <span>{seasonLabel}</span>
                </div>
              )}

              {/* Episodes */}
              {currentAnime.episodes && (
                <div className="flex items-center gap-1.5 text-white/75 font-medium">
                  <Tv size={14} className="text-white/40" />
                  <span>Ep {currentAnime.episodes}</span>
                </div>
              )}
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-white/70 line-clamp-2 leading-relaxed font-normal max-w-xl">
              {synopsis}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              {/* Watch Now — Crisp White Button with Magenta Glow on Hover */}
              <Link href={`/watch/${currentAnime.id}/1`}>
                <button className="flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-white/90 text-black font-extrabold text-xs sm:text-sm transition-all duration-200 active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_25px_rgba(255,42,133,0.45)] group">
                  <Play
                    size={16}
                    className="fill-black text-black group-hover:scale-110 transition-transform"
                  />
                  <span>Watch Now</span>
                </button>
              </Link>

              {/* Details — Sleek Glass Button */}
              <Link href={`/anime/${currentAnime.id}`} title="View Details">
                <button className="flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all active:scale-95 text-xs sm:text-sm font-bold">
                  <Info size={16} />
                  <span>Details</span>
                </button>
              </Link>

              {/* Bookmark Button */}
              <button
                onClick={handleListToggle}
                title={inList ? "In My List" : "Add to List"}
                className={cn(
                  "p-2.5 sm:p-3 rounded-xl backdrop-blur-md border transition-all active:scale-95 flex items-center justify-center",
                  inList
                    ? "bg-magenta-500/20 border-magenta-500/50 text-magenta-400 shadow-[0_0_15px_rgba(255,42,133,0.3)]"
                    : "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                )}
              >
                {inList ? (
                  <Check size={18} className="stroke-[2.5]" />
                ) : (
                  <Bookmark size={18} />
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Carousel Bottom Controls ── */}
        {list.length > 1 && (
          <div className="flex items-center justify-between pt-5 mt-6 border-t border-white/5">
            {/* Left: Indicator Bars */}
            <div className="flex items-center gap-2">
              {list.map((_, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300 cursor-pointer",
                      isActive
                        ? "w-8 bg-gradient-to-r from-magenta-400 to-pink-400 shadow-[0_0_10px_rgba(255,42,133,0.6)]"
                        : "w-3 bg-white/20 hover:bg-white/40"
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Right: Chevrons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevSlide}
                className="p-1.5 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                aria-label="Previous slide"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                onClick={nextSlide}
                className="p-1.5 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                aria-label="Next slide"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
