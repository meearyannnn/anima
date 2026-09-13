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

  useEffect(() => { setMounted(true); }, []);

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
    ? truncate(stripHtml(currentAnime.description), 200)
    : "No synopsis available.";

  const bannerUrl = currentAnime.bannerImage ?? currentAnime.coverImage?.extraLarge;
  const coverUrl = currentAnime.coverImage?.large;

  const seasonLabel = currentAnime.season
    ? `${currentAnime.season.charAt(0) + currentAnime.season.slice(1).toLowerCase()} ${currentAnime.seasonYear ?? ""}`.trim()
    : currentAnime.seasonYear
    ? String(currentAnime.seasonYear)
    : "";

  const score = currentAnime.averageScore
    ? (currentAnime.averageScore / 10).toFixed(1)
    : null;

  const statusLabel =
    currentAnime.status === "RELEASING"
      ? "Airing"
      : currentAnime.status === "FINISHED"
      ? "Completed"
      : currentAnime.status?.replace("_", " ") || "Airing";

  const isAiring = currentAnime.status === "RELEASING";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-black select-none"
      style={{ height: "78vh", minHeight: 560, maxHeight: 860 }}
    >
      {/* ── Background Banner ── */}
      <AnimatePresence mode="wait">
        {bannerUrl && (
          <motion.div
            key={`bg-${currentAnime.id}`}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="absolute inset-0"
          >
            <Image
              src={bannerUrl}
              alt={title}
              fill
              priority
              className="object-cover object-[center_20%]"
              sizes="100vw"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dark Gradient Layers ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07070f] via-[#07070f]/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07070f] via-[#07070f]/65 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07070f]/80 to-transparent" />

      {/* ── Single Subtle Magenta Ambient Orb ── */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 520, height: 520,
          background: "radial-gradient(circle, #e040fb 0%, transparent 65%)",
          opacity: 0.12, top: "5%", left: "-10%",
          animation: "heroDrift1 10s ease-in-out infinite alternate",
        }}
      />

      {/* ── Bottom Accent Glow Line ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, #e040fb55 30%, #e040fbaa 50%, #e040fb55 70%, transparent 100%)",
          boxShadow: "0 0 20px 3px rgba(224,64,251,0.3)",
        }}
      />

      {/* ── Main Content ── */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-6 sm:px-10 md:px-14 flex flex-col justify-end pb-14 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentAnime.id}`}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex items-end gap-8 max-w-5xl"
          >
            {/* ── Cover Art Card ── */}
            {coverUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="hidden md:block flex-shrink-0 relative"
                style={{ width: 148, height: 212 }}
              >
                <div
                  className="absolute -inset-2 rounded-2xl blur-xl pointer-events-none"
                  style={{ background: "rgba(224,64,251,0.3)" }}
                />
                <div className="relative w-full h-full rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                  <Image src={coverUrl} alt={title} fill className="object-cover" sizes="148px" />
                </div>
              </motion.div>
            )}

            {/* ── Text Side ── */}
            <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
              {/* Genre pills */}
              {currentAnime.genres && currentAnime.genres.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {currentAnime.genres.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                      style={{
                        borderColor: "rgba(224,64,251,0.35)",
                        color: "rgba(224,64,251,0.9)",
                        background: "rgba(224,64,251,0.08)",
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <DualToneHeading
                text={title}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight line-clamp-2"
              />

              {/* Metadata */}
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold flex-wrap">
                {isAiring ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    {statusLabel}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-white/8 border border-white/12 text-white/65 text-xs font-bold uppercase tracking-wider">
                    {statusLabel}
                  </span>
                )}

                {score && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-xs">{score}</span>
                  </div>
                )}

                {seasonLabel && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Calendar size={13} className="text-white/35" />
                    <span>{seasonLabel}</span>
                  </div>
                )}

                {currentAnime.episodes && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Tv size={13} className="text-white/35" />
                    <span>{currentAnime.episodes} Episodes</span>
                  </div>
                )}
              </div>

              {/* Synopsis */}
              <p className="text-xs sm:text-sm text-white/55 line-clamp-2 leading-relaxed font-medium max-w-xl">
                {synopsis}
              </p>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <Link href={`/watch/${currentAnime.id}/1`}>
                  <button
                    className="group relative flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm text-white transition-all duration-200 active:scale-95 overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #e040fb 0%, #9c27b0 100%)",
                      boxShadow: "0 0 24px rgba(224,64,251,0.45), 0 4px 16px rgba(0,0,0,0.35)",
                    }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <Play size={15} className="fill-white text-white relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="relative z-10">Watch Now</span>
                  </button>
                </Link>

                <Link href={`/anime/${currentAnime.id}`} title="View Details">
                  <button className="flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 backdrop-blur-md border border-white/12 transition-all active:scale-95 text-xs sm:text-sm font-bold">
                    <Info size={15} />
                    <span>Details</span>
                  </button>
                </Link>

                <button
                  onClick={handleListToggle}
                  title={inList ? "In My List" : "Add to List"}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl backdrop-blur-md border transition-all active:scale-95 flex items-center justify-center",
                    inList
                      ? "bg-[#e040fb]/20 border-[#e040fb]/40 text-[#e040fb]"
                      : "bg-white/10 hover:bg-white/15 border-white/12 text-white/80"
                  )}
                >
                  {inList ? <Check size={17} className="stroke-[2.5]" /> : <Bookmark size={17} />}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Carousel Controls ── */}
        {list.length > 1 && (
          <div className="flex items-center justify-between pt-7 mt-7 border-t border-white/[0.05]">
            <div className="flex items-center gap-2">
              {list.map((_, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      height: 4,
                      width: isActive ? 32 : 10,
                      background: isActive
                        ? "linear-gradient(90deg, #e040fb, #9c27b0)"
                        : "rgba(255,255,255,0.2)",
                      boxShadow: isActive ? "0 0 8px rgba(224,64,251,0.65)" : "none",
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevSlide}
                className="p-1.5 text-white/40 hover:text-white transition-colors hover:bg-white/8 rounded-full"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="p-1.5 text-white/40 hover:text-white transition-colors hover:bg-white/8 rounded-full"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes heroDrift1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -24px) scale(1.06); }
        }
      `}</style>
    </div>
  );
}
