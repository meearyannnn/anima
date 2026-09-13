"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, X, Filter } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/ui/Skeleton";
import { searchAnime } from "@/lib/api/anilist";
import { cn } from "@/lib/utils";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import type { AniListMedia } from "@/lib/types";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi",
  "Slice of Life", "Sports", "Supernatural", "Thriller",
];

const FORMATS = [
  { label: "TV", value: "TV" },
  { label: "Movie", value: "MOVIE" },
  { label: "OVA", value: "OVA" },
  { label: "Special", value: "SPECIAL" },
];

const STATUSES = [
  { label: "Airing", value: "RELEASING" },
  { label: "Finished", value: "FINISHED" },
  { label: "Upcoming", value: "NOT_YET_RELEASED" },
];

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get("genre") ? [searchParams.get("genre")!] : []
  );
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const hasFilters = Boolean(
    selectedGenres.length > 0 || selectedFormat || selectedStatus || selectedYear
  );
  const hasSearch = Boolean(debouncedQuery.trim().length > 0 || hasFilters);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery, selectedGenres, selectedFormat, selectedStatus, selectedYear],
    queryFn: () =>
      searchAnime({
        query: debouncedQuery || undefined,
        genres: selectedGenres.length ? selectedGenres : undefined,
        format: selectedFormat || undefined,
        status: selectedStatus || undefined,
        year: selectedYear,
        perPage: 24,
      }),
    enabled: hasSearch,
    placeholderData: keepPreviousData,
  });

  const anime: AniListMedia[] = data?.Page?.media ?? [];
  const loading = isLoading || isFetching;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedFormat("");
    setSelectedStatus("");
    setSelectedYear(undefined);
  };

  return (
    <div className="min-h-screen pt-24 pb-28 sm:pb-24 px-4 sm:px-6 md:px-16">
      {/* Search hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-10"
      >
        <div className="text-center mb-2">
          <DualToneHeading
            as="h1"
            text="Find Your Next Anime"
            className="text-3xl md:text-4xl font-black tracking-tight"
          />
        </div>
        <p className="text-kuro-muted text-center text-sm mb-8">
          Search from thousands of anime series and movies
        </p>

        {/* Search bar */}
        <div className="relative">
          <Search
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-kuro-muted pointer-events-none"
          />
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime titles, genres..."
            autoFocus
            className={cn(
              "w-full bg-kuro-surface border border-kuro-border rounded-2xl pl-14 pr-14 py-4",
              "text-white placeholder-kuro-muted text-base",
              "focus:outline-none focus:border-magenta-500 focus:shadow-[0_0_20px_rgba(255,42,133,0.3)]",
              "transition-all duration-300"
            )}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-kuro-muted hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all",
              showFilters || hasFilters
                ? "bg-magenta-500/15 text-magenta-400 border border-magenta-500/30 font-bold"
                : "text-kuro-muted hover:text-white hover:bg-white/5"
            )}
          >
            <Filter size={16} />
            Filters
            {hasFilters && (
              <span className="bg-magenta-500 text-white font-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedGenres.length + (selectedFormat ? 1 : 0) + (selectedStatus ? 1 : 0) + (selectedYear ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="max-w-4xl mx-auto mb-10 glass rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Filters</h3>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-magenta-400 font-bold hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Format */}
          <div className="mb-4">
            <p className="text-kuro-muted text-xs uppercase tracking-wide mb-2">Format</p>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() =>
                    setSelectedFormat(selectedFormat === f.value ? "" : f.value)
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                    selectedFormat === f.value
                      ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-[0_0_10px_rgba(255,42,133,0.35)]"
                      : "border-white/10 text-white/70 hover:border-magenta-500/50 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="mb-4">
            <p className="text-kuro-muted text-xs uppercase tracking-wide mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() =>
                    setSelectedStatus(selectedStatus === s.value ? "" : s.value)
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                    selectedStatus === s.value
                      ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-[0_0_10px_rgba(255,42,133,0.35)]"
                      : "border-white/10 text-white/70 hover:border-magenta-500/50 hover:text-white"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Year */}
          <div className="mb-4">
            <p className="text-kuro-muted text-xs uppercase tracking-wide mb-2">Year</p>
            <select
              value={selectedYear ?? ""}
              onChange={(e) =>
                setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="bg-kuro-surface border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-magenta-500"
            >
              <option value="">Any Year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Genres */}
          <div>
            <p className="text-kuro-muted text-xs uppercase tracking-wide mb-2">Genres</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    selectedGenres.includes(g)
                      ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-[0_0_10px_rgba(255,42,133,0.35)]"
                      : "border-white/10 text-white/70 hover:border-magenta-500/50 hover:text-white"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {hasSearch && (
        <div className="max-w-7xl mx-auto">
          {loading && anime.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Array.from({ length: 18 }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          ) : anime.length > 0 ? (
            <>
              <p className="text-kuro-muted text-sm mb-6">
                Found{" "}
                <span className="text-yellow-400 font-bold">
                  {data?.Page?.pageInfo?.total ?? anime.length}
                </span>{" "}
                results
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {anime.map((a, i) => (
                  <AnimeCard key={a.id} anime={a} index={i} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-kuro-text-dim font-semibold text-lg mb-2">No results found</p>
              <p className="text-kuro-muted text-sm">
                Try adjusting your search term or filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Default state */}
      {!hasSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-6xl mb-6">🎌</p>
          <p className="text-kuro-text-dim font-semibold text-lg">
            Start typing to discover anime
          </p>
        </motion.div>
      )}
    </div>
  );
}
