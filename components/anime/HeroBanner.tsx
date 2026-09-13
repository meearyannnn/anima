"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Info,
  Calendar,
  Tv,
  Clock,
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
  // Normalize anime items into an array
  const list = animeList && animeList.length > 0 ? animeList : anime ? [anime] : [];
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
    if (currentAnime) {
      setMoodFromGenres(currentAnime.genres, title);
    }
  }, [currentAnime, title, setMoodFromGenres]);

  const nextSlide = useCallback(() => {
    if (list.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % list.length);
  }, [list.length]);

  const prevSlide = useCallback(() => {
    if (list.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  }, [list.length]);

  // Auto-advance every 6.5s unless hovered
  useEffect(() => {
    if (isPaused || list.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6500);
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

  const bannerUrl = currentAnime.bannerImage ?? currentAnime.coverImage?.extraLarge;

  // Format season text
  const seasonLabel = currentAnime.season
    ? `${currentAnime.season.charAt(0) + currentAnime.season.slice(1).toLowerCase()} ${currentAnime.seasonYear ?? ""}`.trim()
    : currentAnime.seasonYear
    ? String(currentAnime.seasonYear)
    : "Summer 2026";

  const statusLabel =
    currentAnime.status === "RELEASING"
      ? "Airing soon"
      : currentAnime.status === "FINISHED"
      ? "Completed"
      : currentAnime.status?.replace("_", " ") || "Airing soon";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[72vh] min-h-[540px] max-h-[780px] overflow-hidden bg-black select-none"
    >
      {/* Background Banner with Crossfade Transition */}
      <AnimatePresence mode="wait">
        {bannerUrl && (
          <motion.div
            key={currentAnime.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={bannerUrl}
              alt={title}
              fill
              priority
              className="object-cover object-[center_20%] opacity-85"
              sizes="100vw"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Vignette & Dark Gradients — identical to ANIMEX style */}
      <div className="absolute inset-0 bg-gradient-to-t from-kuro-bg via-kuro-bg/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-kuro-bg/95 via-kuro-bg/60 to-transparent" />
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 flex flex-col justify-end pb-12 sm:pb-16 pt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnime.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="max-w-2xl space-y-3 sm:space-y-4"
          >
            {/* Anime Title in Signature Shiny White & Magenta Gradient */}
            <DualToneHeading
              text={title}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight line-clamp-2"
            />

            {/* Metadata Badges Strip */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold text-white/90 flex-wrap">
              {/* RELEASING Badge */}
              <span className="text-emerald-400 font-extrabold uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5">
                {currentAnime.status || "RELEASING"}
              </span>

              {/* Season & Year */}
              <div className="flex items-center gap-1.5 text-white/80 font-medium">
                <Calendar size={15} className="text-white/60" />
                <span>{seasonLabel}</span>
              </div>

              {/* Episodes */}
              <div className="flex items-center gap-1.5 text-white/80 font-medium">
                <Tv size={15} className="text-white/60" />
                <span>Ep {currentAnime.episodes ?? 12}</span>
              </div>

              {/* Airing / Status */}
              <div className="flex items-center gap-1.5 text-white/80 font-medium">
                <Clock size={15} className="text-white/60" />
                <span>{statusLabel}</span>
              </div>
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-white/75 line-clamp-2 leading-relaxed font-medium max-w-xl">
              {synopsis}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {/* Watch Now Button (Solid White with Black Play Icon) */}
              <Link href={`/watch/${currentAnime.id}/1`}>
                <button className="flex items-center gap-2.5 px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-white/90 text-black font-extrabold text-xs sm:text-sm transition-transform active:scale-95 shadow-[0_4px_25px_rgba(255,255,255,0.25)] group">
                  <Play size={16} className="fill-black text-black group-hover:scale-110 transition-transform" />
                  <span>Watch Now</span>
                </button>
              </Link>

              {/* Details Button (Translucent Glass Round/Squircle) */}
              <Link href={`/anime/${currentAnime.id}`} title="View Details">
                <button className="p-2.5 sm:p-3 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/15 transition-all active:scale-95 flex items-center justify-center">
                  <Info size={18} />
                </button>
              </Link>

              {/* Bookmark to List Button */}
              <button
                onClick={handleListToggle}
                title={inList ? "In My List" : "Add to List"}
                className={cn(
                  "p-2.5 sm:p-3 rounded-xl backdrop-blur-md border transition-all active:scale-95 flex items-center justify-center",
                  inList
                    ? "bg-magenta-500/25 border-magenta-500/50 text-magenta-400"
                    : "bg-white/15 hover:bg-white/25 border-white/15 text-white"
                )}
              >
                {inList ? <Check size={18} className="stroke-[3]" /> : <Bookmark size={18} />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Carousel Controls Row: Left Dash Indicators, Right Chevrons */}
        {list.length > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
            {/* Left: Dash Progress Indicators */}
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
                        ? "w-8 bg-white"
                        : "w-3 bg-white/25 hover:bg-white/50"
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Right: Prev & Next Chevron Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevSlide}
                className="p-1.5 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="p-1.5 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
