"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Plus, Check, Star, Info, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { useMyList } from "@/lib/store/useMyList";
import { useToast } from "@/lib/store/useToast";
import { useMoodRing } from "@/lib/store/useMoodRing";
import { getAnimeTitle, formatScore, stripHtml, truncate } from "@/lib/utils";
import type { AniListMedia } from "@/lib/types";

interface HeroBannerProps {
  anime: AniListMedia;
}

export function HeroBanner({ anime }: HeroBannerProps) {
  const [mounted, setMounted] = useState(false);
  const title = getAnimeTitle(anime.title);
  const { isInList, addToList, removeFromList } = useMyList();
  const { success, info } = useToast();
  const { setMoodFromGenres } = useMoodRing();

  useEffect(() => {
    setMounted(true);
    setMoodFromGenres(anime.genres, title);
  }, [anime.genres, anime.id, title, setMoodFromGenres]);

  const inList = mounted && isInList(anime.id);

  const handleListToggle = () => {
    if (inList) {
      removeFromList(anime.id);
      info(`Removed "${title}" from your list`);
    } else {
      addToList({
        id: anime.id,
        title,
        coverImage: anime.coverImage?.large ?? "",
        genres: anime.genres ?? [],
        averageScore: anime.averageScore ?? null,
        episodes: anime.episodes ?? null,
        status: anime.status ?? "",
      });
      success(`Added "${title}" to your list`);
    }
  };

  const synopsis = anime.description
    ? truncate(stripHtml(anime.description), 220)
    : "No synopsis available.";

  const bannerUrl = anime.bannerImage ?? anime.coverImage?.extraLarge;

  return (
    <div className="relative w-full min-h-[88svh] sm:min-h-[780px] md:min-h-[820px] lg:h-[94vh] max-h-[1000px] overflow-hidden">
      {/* Background Image with ambient dark vignette */}
      {bannerUrl && (
        <div className="absolute inset-0">
          <Image
            src={bannerUrl}
            alt={title}
            fill
            priority
            className="object-cover object-top scale-105 transition-transform duration-1000"
            sizes="100vw"
          />
          {/* Subtle noise/vignette gradient */}
          <div className="absolute inset-0 bg-kuro-bg/40 backdrop-blur-[2px]" />
        </div>
      )}

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-kuro-bg via-kuro-bg/85 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-kuro-bg via-kuro-bg/40 to-transparent" />

      {/* Content with safe top padding to never collide with floating navbar */}
      <div className="absolute inset-0 flex flex-col justify-end pt-20 sm:pt-36 md:pt-40 pb-20 sm:pb-24 px-5 md:px-16 max-w-7xl mx-auto z-10">
        <div className="max-w-3xl">
          {/* Gen-Z Spotlight Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-3"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-magenta-500/15 border border-magenta-500/40 text-magenta-400 text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(255,42,133,0.3)]">
              <Sparkles size={12} className="text-magenta-400 fill-magenta-400 animate-pulse" />
              <span>SPOTLIGHT OF THE SEASON</span>
            </div>

            {anime.status === "RELEASING" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] sm:text-xs font-bold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-magenta-500 animate-ping" />
                <span>AIRING NOW</span>
              </div>
            )}
          </motion.div>

          {/* Title with White & Shiny Magenta Half-and-Half Combo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-3"
          >
            <DualToneHeading
              text={title}
              className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight"
            />
          </motion.div>

          {/* Meta & Genre Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center gap-2 mb-3"
          >
            {anime.averageScore && (
              <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 backdrop-blur-md rounded-xl px-2.5 py-1">
                <Star size={12} className="text-magenta-400 fill-magenta-400" />
                <span className="font-extrabold text-white text-xs">
                  {formatScore(anime.averageScore)}
                </span>
              </div>
            )}

            {anime.seasonYear && (
              <span className="text-xs font-bold text-white/80 px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/[0.12]">
                {anime.seasonYear}
              </span>
            )}

            {anime.episodes && (
              <span className="text-xs font-bold text-white/80 px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/[0.12]">
                {anime.episodes} Eps
              </span>
            )}

            {anime.genres?.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-magenta-500/10 text-magenta-300 border border-magenta-500/20 hidden sm:inline-flex"
              >
                {g}
              </span>
            ))}
          </motion.div>

          {/* Synopsis — hidden on very small screens to keep it clean */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden sm:block text-kuro-text-dim text-sm sm:text-base leading-relaxed mb-6 max-w-xl line-clamp-3"
          >
            {synopsis}
          </motion.p>

          {/* CTA Buttons with Neon Glow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link href={`/watch/${anime.id}/1`}>
              <Button
                size="lg"
                className="gap-2.5 rounded-2xl font-black text-sm px-6 py-3 h-auto bg-magenta-500 hover:bg-magenta-400 text-white shadow-[0_0_35px_rgba(255,42,133,0.55)] hover:shadow-[0_0_50px_rgba(255,42,133,0.85)] hover:scale-105 active:scale-95 transition-all border border-magenta-400"
              >
                <Play size={16} className="fill-white text-white" />
                <span className="hidden xs:inline">Stream Episode 1</span>
                <span className="xs:hidden">Play Ep 1</span>
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="lg"
              onClick={handleListToggle}
              className="gap-2 rounded-2xl font-bold text-sm px-5 py-3 h-auto bg-white/[0.08] hover:bg-white/[0.14] hover:border-magenta-500/60 border border-white/15 text-white backdrop-blur-xl transition-all active:scale-95"
            >
              {inList ? (
                <Check size={16} className="text-magenta-400 stroke-[3]" />
              ) : (
                <Plus size={16} />
              )}
              {inList ? "Saved" : "Save"}
            </Button>

            <Link href={`/anime/${anime.id}`}>
              <Button
                variant="ghost"
                size="lg"
                className="gap-2 rounded-2xl font-bold text-sm px-5 py-3 h-auto text-white/70 hover:text-white transition-all active:scale-95 hidden sm:flex"
              >
                <Info size={16} />
                Details
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
