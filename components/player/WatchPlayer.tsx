"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getEmbedUrl, type EmbedProvider } from "@/lib/api/tmdb";
import { cn } from "@/lib/utils";

interface WatchPlayerProps {
  tmdbId: number;
  season?: number;
  episode?: number;
  isMovie?: boolean;
  title?: string;
  episodeName?: string;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

const SERVERS: { id: EmbedProvider; name: string; tag: string }[] = [
  { id: "vidlink", name: "VidLink", tag: "Fast & Clean" },
  { id: "2embed", name: "2Embed", tag: "High Quality" },
  { id: "vidsrc", name: "VidSrc", tag: "Multi-Audio" },
  { id: "embedsu", name: "EmbedSU", tag: "Mirror" },
];

export function WatchPlayer({
  tmdbId,
  season = 1,
  episode = 1,
  isMovie = false,
  title,
  episodeName,
  hasNext,
  hasPrev,
  onNextEpisode,
  onPrevEpisode,
}: WatchPlayerProps) {
  const [selectedServer, setSelectedServer] = useState<EmbedProvider>("vidlink");
  const [iframeKey, setIframeKey] = useState(0);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const embedUrl = getEmbedUrl(selectedServer, tmdbId, season, episode, isMovie);

  const handleServerChange = (serverId: EmbedProvider) => {
    setSelectedServer(serverId);
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 transition-all duration-300",
        theaterMode ? "w-full max-w-none" : "w-full max-w-6xl mx-auto"
      )}
    >
      {/* Top player bar: Server switchers + Theater mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-kuro-surface/80 border border-kuro-border rounded-xl px-4 py-2.5 backdrop-blur-md">
        {/* Server Selection */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-kuro-text-dim mr-2">
            <Server size={14} className="text-kuro-accent" />
            <span>SERVER:</span>
          </div>

          {SERVERS.map((srv) => {
            const isActive = selectedServer === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => handleServerChange(srv.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                  isActive
                    ? "bg-kuro-accent text-white shadow-glow-sm"
                    : "bg-white/5 text-kuro-text-dim hover:text-white hover:bg-white/10"
                )}
              >
                <span>{srv.name}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-white/5 text-kuro-muted"
                  )}
                >
                  {srv.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2">
          {/* Reload button */}
          <button
            onClick={handleReload}
            title="Reload Player"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-kuro-text-dim hover:text-white transition-colors"
          >
            <RotateCcw size={15} />
          </button>

          {/* Theater mode toggle */}
          <button
            onClick={() => setTheaterMode(!theaterMode)}
            title={theaterMode ? "Exit Theater Mode" : "Theater Mode"}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-kuro-text-dim hover:text-white transition-colors hidden sm:inline-flex"
          >
            {theaterMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Open source in tab */}
          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            title="Open in new tab"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-kuro-text-dim hover:text-white transition-colors"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* Video Iframe Container */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-kuro-border shadow-2xl">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-kuro-bg/90 z-10 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-kuro-accent border-t-transparent animate-spin" />
            <p className="text-xs text-kuro-text-dim font-medium">Connecting to {selectedServer}...</p>
          </div>
        )}

        {/* Embedded Iframe */}
        <iframe
          key={`${selectedServer}-${tmdbId}-${season}-${episode}-${iframeKey}`}
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Bottom bar: Prev/Next episode & title info */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-kuro-accent/20 text-kuro-accent border border-kuro-accent/30">
            {isMovie ? "Movie" : `Season ${season} • Episode ${episode}`}
          </span>
          {episodeName && (
            <span className="text-sm font-medium text-white truncate max-w-md">
              {episodeName}
            </span>
          )}
        </div>

        {/* Navigation controls */}
        {!isMovie && (
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevEpisode}
              disabled={!hasPrev}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                hasPrev
                  ? "bg-white/5 hover:bg-white/10 text-white"
                  : "opacity-40 cursor-not-allowed text-kuro-muted bg-white/5"
              )}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              onClick={onNextEpisode}
              disabled={!hasNext}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                hasNext
                  ? "bg-kuro-accent hover:bg-purple-600 text-white shadow-glow-sm"
                  : "opacity-40 cursor-not-allowed text-kuro-muted bg-white/5"
              )}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Embedded Player Info Tip */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-kuro-text-dim">
        <ShieldCheck size={14} className="text-kuro-accent flex-shrink-0" />
        <span>
          Subtitles, audio language, and skip intro are handled directly inside the player. Switch servers above if the stream is slow or unavailable.
        </span>
      </div>
    </div>
  );
}
