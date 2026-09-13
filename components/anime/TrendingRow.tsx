"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/ui/Skeleton";
import type { AniListMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TrendingRowProps {
  title: string;
  anime: AniListMedia[];
  isLoading?: boolean;
  className?: string;
}

export function TrendingRow({ title, anime, isLoading, className }: TrendingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  return (
    <section className={cn("relative", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-8 md:px-16">
        <DualToneHeading as="h2" text={title} className="text-xl md:text-2xl font-bold" />
        <div className="hidden sm:flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              canScrollLeft
                ? "bg-kuro-surface border border-white/10 text-white hover:border-magenta-500 hover:text-magenta-400"
                : "opacity-20 cursor-not-allowed bg-kuro-surface"
            )}
          >
            <ChevronLeft size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              canScrollRight
                ? "bg-kuro-surface border border-white/10 text-white hover:border-magenta-500 hover:text-magenta-400"
                : "opacity-20 cursor-not-allowed bg-kuro-surface"
            )}
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>

      {/* Scroll container — finger-swipeable on mobile */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar px-4 sm:px-8 md:px-16 pb-4 -webkit-overflow-scrolling-touch"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 sm:w-40 md:w-48">
                <AnimeCardSkeleton />
              </div>
            ))
          : anime.map((a, i) => (
              <AnimeCard
                key={a.id}
                anime={a}
                index={i}
                className="w-32 sm:w-40 md:w-48"
              />
            ))}
      </div>
    </section>
  );
}
