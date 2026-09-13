"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BookOpen, Star, Sparkles } from "lucide-react";
import { cn, formatScore, getAnimeTitle } from "@/lib/utils";
import type { AniListMedia } from "@/lib/types";

interface MangaCardProps {
  manga: AniListMedia;
  index?: number;
  className?: string;
  priority?: boolean;
}

export function MangaCard({ manga, index = 0, className, priority = false }: MangaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Physics
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateXSpring = useSpring(useTransform(y, [0, 1], [8, -8]), {
    stiffness: 260,
    damping: 24,
  });
  const rotateYSpring = useSpring(useTransform(x, [0, 1], [-8, 8]), {
    stiffness: 260,
    damping: 24,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  const title = getAnimeTitle(manga.title);
  const score = formatScore(manga.averageScore);
  const coverUrl = manga.coverImage?.extraLarge || manga.coverImage?.large;
  const isManhwa = manga.countryOfOrigin === "KR";

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
        className="relative flex flex-col rounded-2xl bg-kuro-card/80 border border-white/10 hover:border-kuro-magenta/40 transition-colors shadow-lg hover:shadow-[0_15px_35px_rgba(255,42,133,0.2)] overflow-hidden"
      >
        <Link href={`/manga/${manga.id}`} className="block">
          {/* Poster Image Container */}
          <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-black/50">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={title}
                fill
                priority={priority}
                sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 220px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-kuro-lavender/40">
                <BookOpen size={36} />
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
              <span
                className={cn(
                  "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md border shadow-sm",
                  isManhwa
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    : "bg-kuro-magenta/20 text-kuro-magenta border-kuro-magenta/30"
                )}
              >
                {isManhwa ? "Manhwa" : manga.format || "Manga"}
              </span>

              {score && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  {score}%
                </span>
              )}
            </div>

            {/* Read Button Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kuro-magenta text-white text-xs font-bold shadow-[0_0_20px_rgba(255,42,133,0.6)] transform scale-90 group-hover:scale-100 transition-transform">
                <BookOpen size={14} />
                Read Manga
              </span>
            </div>

            {/* Bottom info pills on poster */}
            <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-white/80">
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                {manga.chapters ? `${manga.chapters} Chs` : manga.status === "RELEASING" ? "Releasing" : "Ongoing"}
              </span>
              {manga.volumes && (
                <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                  {manga.volumes} Vol{manga.volumes > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="p-3">
            <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-kuro-magenta transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-[11px] text-kuro-lavender/60 truncate mt-0.5">
              {manga.genres?.slice(0, 2).join(" • ") || "Manga Series"}
            </p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
