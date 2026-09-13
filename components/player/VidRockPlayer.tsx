"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Settings,
  Sparkles,
  Zap,
  Globe,
  HelpCircle,
  X,
  Sun,
  SlidersHorizontal,
  Download,
  Tv,
  Check,
} from "lucide-react";
import { getEmbedUrl, type EmbedProvider, type PlayerOptions } from "@/lib/api/tmdb";
import { cn } from "@/lib/utils";
import { SaitamaLoader } from "@/components/ui/SaitamaLoader";

export interface VidRockPlayerProps {
  tmdbId?: string | number;
  imdbId?: string;
  season?: number;
  episode?: number;
  isMovie?: boolean;
  title?: string;
  episodeName?: string;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  onTogglePip?: () => void;
  isPipActive?: boolean;
  isCinemaMode?: boolean;
  onToggleCinema?: () => void;
  overlay?: React.ReactNode;
  directStreamUrl?: string | null;
  onSelectNativeStream?: () => void;
}

const SERVERS: { id: EmbedProvider; name: string; tag: string }[] = [
  { id: "vidrock", name: "Server 1", tag: "Recommended" },
  { id: "vidsrcsbs", name: "Server 2", tag: "Fast CDN" },
  { id: "vidsrcto", name: "Server 3", tag: "HD Mirror" },
  { id: "vidsrc", name: "Server 4", tag: "Backup" },
];

const THEMES = [
  { label: "Cyber Magenta", hex: "ff2a85", bg: "bg-[#ff2a85]" },
  { label: "Neon Cyan", hex: "00f5ff", bg: "bg-[#00f5ff]" },
  { label: "Electric Purple", hex: "8b5cf6", bg: "bg-[#8b5cf6]" },
  { label: "Emerald Green", hex: "10b981", bg: "bg-[#10b981]" },
  { label: "Amber Gold", hex: "f59e0b", bg: "bg-[#f59e0b]" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "Japanese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
];

const QUALITIES = [
  { id: "1080p", label: "1080p Ultra HD", desc: "Crisp High Bitrate (Recommended)" },
  { id: "720p", label: "720p HD", desc: "Fast & Smooth Streaming" },
  { id: "480p", label: "480p SD", desc: "Data Saver Mode" },
];

export default function VidRockPlayer({
  tmdbId,
  imdbId,
  season = 1,
  episode = 1,
  isMovie = false,
  title,
  episodeName,
  hasNext,
  hasPrev,
  onNextEpisode,
  onPrevEpisode,
  onTogglePip,
  isPipActive = false,
  isCinemaMode = false,
  onToggleCinema,
  overlay,
  directStreamUrl,
  onSelectNativeStream,
}: VidRockPlayerProps) {
  const streamId = tmdbId || imdbId;

  // Player state & preferences
  const [selectedServer, setSelectedServer] = useState<EmbedProvider>("vidrock");
  const [autoplay, setAutoplay] = useState(true);
  const [autonext, setAutonext] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("ff2a85");
  const [subLang, setSubLang] = useState("en");
  const [showDownload, setShowDownload] = useState(false);
  const [ambientMode, setAmbientMode] = useState<"magenta" | "reactive" | "off">("magenta");
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [audioMode, setAudioMode] = useState<"sub" | "dub">("sub");

  // UI state
  const [iframeKey, setIframeKey] = useState(0);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedAutoplay = localStorage.getItem("kuro_player_autoplay");
      if (savedAutoplay !== null) setAutoplay(savedAutoplay === "true");

      savePref("kuro_player_autonext", "false");

      const savedTheme = localStorage.getItem("kuro_player_theme");
      if (savedTheme) setSelectedTheme(savedTheme);

      const savedLang = localStorage.getItem("kuro_player_lang");
      if (savedLang) setSubLang(savedLang);

      const savedAmbient = localStorage.getItem("kuro_player_ambient");
      if (savedAmbient) setAmbientMode(savedAmbient as "magenta" | "reactive" | "off");

      const savedQuality = localStorage.getItem("kuro_player_quality");
      if (savedQuality) setSelectedQuality(savedQuality);
    } catch {}
  }, []);

  const savePref = (key: string, val: string) => {
    try {
      localStorage.setItem(key, val);
    } catch {}
  };

  const cycleAmbientMode = () => {
    const nextMode = ambientMode === "magenta" ? "reactive" : ambientMode === "reactive" ? "off" : "magenta";
    setAmbientMode(nextMode);
    savePref("kuro_player_ambient", nextMode);
  };

  if (!streamId) {
    return (
      <div className="flex flex-col items-center justify-center w-full aspect-video bg-kuro-surface border border-kuro-border rounded-2xl p-8 text-center shadow-xl">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <Server size={26} />
        </div>
        <p className="text-white font-bold text-lg mb-1">No stream ID found for this anime.</p>
        <p className="text-kuro-muted text-xs max-w-sm">
          Unable to resolve TMDB or IMDB ID for this title. Please try another episode or search for this show.
        </p>
      </div>
    );
  }

  const playerOptions: PlayerOptions = {
    autoplay,
    autonext: false,
    theme: selectedTheme,
    download: showDownload,
    nextbutton: true,
    episodeselector: true,
    lang: subLang,
  };

  const embedUrl = getEmbedUrl(selectedServer, streamId, season, episode, isMovie, playerOptions);

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
        "flex flex-col gap-3 transition-all duration-300 relative",
        theaterMode ? "w-full max-w-none" : "w-full max-w-6xl mx-auto"
      )}
    >
      {/* ─── Ambient Lighting Glow Mode Canvas ─────────────────────────── */}
      {ambientMode !== "off" && (
        <div
          className={cn(
            "absolute -inset-4 rounded-3xl pointer-events-none transition-all duration-700",
            isCinemaMode
              ? "opacity-80 blur-3xl scale-105 animate-pulse bg-gradient-to-r from-magenta-500/70 via-pink-500/60 to-magenta-600/70 shadow-[0_0_120px_rgba(255,42,133,0.6)]"
              : ambientMode === "reactive"
              ? "opacity-45 blur-3xl animate-pulse bg-gradient-to-r from-magenta-500/40 via-pink-500/30 to-magenta-600/40"
              : "opacity-35 blur-2xl bg-magenta-500"
          )}
          style={ambientMode === "magenta" && !isCinemaMode ? { backgroundColor: `#${selectedTheme}` } : undefined}
        />
      )}

      {/* Top player toolbar - Sleek, Aesthetic & User-Friendly */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 bg-kuro-surface/85 border border-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-xl shadow-lg">
        {/* Server Selection Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-white/50 tracking-wider flex items-center gap-1.5 mr-1">
            <Zap size={13} className="text-magenta-400" />
            <span>SERVER:</span>
          </span>

          {directStreamUrl && onSelectNativeStream && (
            <button
              onClick={onSelectNativeStream}
              title="Switch to Ultra-Fast Direct Player (No Ads)"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-magenta-500/15 hover:bg-magenta-500 text-magenta-300 hover:text-white border border-magenta-500/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Zap size={13} className="fill-magenta-400" />
              <span>Direct (Ad-Free)</span>
            </button>
          )}

          {SERVERS.map((srv) => {
            const isActive = selectedServer === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => handleServerChange(srv.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border active:scale-95",
                  isActive
                    ? "bg-magenta-500 text-white border-magenta-500 font-bold shadow-[0_0_15px_rgba(255,42,133,0.4)]"
                    : "bg-white/[0.03] border-white/[0.08] text-white/75 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                <span>{srv.name}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-md font-medium",
                    isActive
                      ? "bg-black/25 text-white"
                      : "bg-white/[0.06] text-white/50"
                  )}
                >
                  {srv.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right utility buttons: Compact, unified, aesthetic */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Cinema Mode Toggle */}
          {onToggleCinema && (
            <button
              onClick={onToggleCinema}
              title={isCinemaMode ? "Exit Cinema Mode (Esc / C)" : "Cinema Mode (C)"}
              className={cn(
                "h-8 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95",
                isCinemaMode
                  ? "bg-magenta-500 text-white border-magenta-500 shadow-[0_0_12px_rgba(255,42,133,0.5)]"
                  : "bg-white/[0.03] border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              <Sparkles size={13} className={isCinemaMode ? "fill-white" : "text-magenta-400"} />
              <span className="hidden sm:inline">Cinema</span>
            </button>
          )}

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Player Preferences, Audio & Quality"
            className={cn(
              "h-8 px-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95",
              showSettings
                ? "bg-magenta-500/20 border-magenta-500/50 text-magenta-400"
                : "bg-white/[0.03] border-white/[0.08] text-white/75 hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Mini-Player / PiP Button */}
          {onTogglePip && (
            <button
              onClick={onTogglePip}
              title={isPipActive ? "Dock Player" : "Picture in Picture"}
              className={cn(
                "h-8 w-8 rounded-xl border text-xs font-medium transition-all flex items-center justify-center active:scale-95 hidden sm:inline-flex",
                isPipActive
                  ? "bg-magenta-500 text-white border-magenta-500"
                  : "bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              <Tv size={14} />
            </button>
          )}

          {/* Reload button */}
          <button
            onClick={handleReload}
            title="Reload Video Stream"
            className="h-8 w-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all flex items-center justify-center active:scale-95"
          >
            <RotateCcw size={14} />
          </button>

          {/* Theater mode toggle */}
          <button
            onClick={() => setTheaterMode(!theaterMode)}
            title={theaterMode ? "Exit Theater Mode" : "Theater Mode"}
            className="h-8 w-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all flex items-center justify-center active:scale-95 hidden sm:inline-flex"
          >
            {theaterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Open in new window */}
          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            title="Open in new window"
            className="h-8 w-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all flex items-center justify-center active:scale-95"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Preferences & Settings Drawer Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="bg-kuro-surface/95 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-magenta-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Player Preferences & Controls
                  </span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-white/50 hover:text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
                {/* Audio Track */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    Audio Language
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAudioMode("sub")}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all",
                        audioMode === "sub"
                          ? "bg-magenta-500 text-white border-magenta-500 shadow-sm"
                          : "bg-white/[0.03] border-white/10 text-white/70 hover:text-white"
                      )}
                    >
                      Japanese (Sub)
                    </button>
                    <button
                      onClick={() => setAudioMode("dub")}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all",
                        audioMode === "dub"
                          ? "bg-magenta-500 text-white border-magenta-500 shadow-sm"
                          : "bg-white/[0.03] border-white/10 text-white/70 hover:text-white"
                      )}
                    >
                      English Dub
                    </button>
                  </div>
                </div>

                {/* Subtitle Language & Autoplay */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    Subtitles & Playback
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={subLang}
                      onChange={(e) => {
                        setSubLang(e.target.value);
                        savePref("kuro_player_lang", e.target.value);
                        setIframeKey((k) => k + 1);
                      }}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-magenta-500 cursor-pointer"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code} className="bg-kuro-surface text-white">
                          {l.label} Subtitles
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white pt-1">
                    <input
                      type="checkbox"
                      checked={autoplay}
                      onChange={(e) => {
                        setAutoplay(e.target.checked);
                        savePref("kuro_player_autoplay", String(e.target.checked));
                        setIframeKey((k) => k + 1);
                      }}
                      className="w-3.5 h-3.5 rounded bg-white/10 border-white/20 text-magenta-500 accent-magenta-500"
                    />
                    <span>Autoplay Video</span>
                  </label>
                </div>

                {/* Ambient Lighting & Accent */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    Glow & Theme Accent
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cycleAmbientMode}
                      className={cn(
                        "flex-1 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                        ambientMode !== "off"
                          ? "bg-magenta-500/20 border-magenta-500/50 text-magenta-400"
                          : "bg-white/[0.03] border-white/10 text-white/60"
                      )}
                    >
                      <Sun size={13} className={ambientMode === "reactive" ? "animate-spin" : ""} />
                      <span>{ambientMode === "magenta" ? "Glow: On" : ambientMode === "reactive" ? "Glow: Pulse" : "Glow: Off"}</span>
                    </button>

                    <div className="flex items-center gap-1.5 pl-1">
                      {THEMES.map((t) => (
                        <button
                          key={t.hex}
                          onClick={() => {
                            setSelectedTheme(t.hex);
                            savePref("kuro_player_theme", t.hex);
                            setIframeKey((k) => k + 1);
                          }}
                          title={t.label}
                          className={cn(
                            "w-4 h-4 rounded-full transition-transform",
                            t.bg,
                            selectedTheme === t.hex ? "scale-125 ring-2 ring-white" : "opacity-50 hover:opacity-100"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Helper Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 bg-kuro-surface/95 border border-kuro-border/80 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex items-center justify-between"
          >
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <HelpCircle size={15} className="text-kuro-accent" />
                Player Shortcuts:
              </span>
              <span className="text-kuro-text-dim">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono mr-1">Space</kbd> Play / Pause
              </span>
              <span className="text-kuro-text-dim">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono mr-1">F</kbd> Fullscreen
              </span>
              <span className="text-kuro-text-dim">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono mr-1">M</kbd> Mute Audio
              </span>
              <span className="text-kuro-text-dim">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono mr-1">← / →</kbd> Seek ±10s
              </span>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="p-1 rounded-lg text-kuro-muted hover:text-white"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Iframe Container */}
      <div className="relative z-10 w-full aspect-video bg-black rounded-3xl overflow-hidden border border-kuro-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-kuro-bg/95 z-20 gap-2 backdrop-blur-md">
            <SaitamaLoader size="sm" text={`Connecting to ${selectedServer}...`} />
          </div>
        )}

        {/* Embedded Iframe */}
        <iframe
          key={`${selectedServer}-${streamId}-${season}-${episode}-${selectedTheme}-${iframeKey}`}
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
        />

        {/* Custom Video Overlay (e.g. KuroSync Bullet Reactions) */}
        {overlay}
      </div>

      {/* Bottom bar: Title, Episode badges, Prev/Next navigation */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-2 py-1">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1 rounded-lg text-white border shadow-glow-sm"
            style={{ backgroundColor: `#${selectedTheme}25`, borderColor: `#${selectedTheme}50` }}
          >
            {isMovie ? "Movie Feature" : `Season ${season} • Episode ${episode}`}
          </span>
          {episodeName && (
            <span className="text-sm font-semibold text-white truncate max-w-md">
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
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border",
                hasPrev
                  ? "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.1] text-white"
                  : "opacity-40 cursor-not-allowed text-kuro-muted bg-white/[0.02] border-white/[0.04]"
              )}
            >
              <ChevronLeft size={15} />
              <span>Previous Ep</span>
            </button>

            <button
              onClick={onNextEpisode}
              disabled={!hasNext}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-[0_0_15px_rgba(255,42,133,0.45)]",
                hasNext
                  ? "bg-magenta-500 border-magenta-500 text-white hover:bg-magenta-400"
                  : "opacity-40 cursor-not-allowed text-kuro-muted bg-white/[0.02] border-white/[0.04]"
              )}
            >
              <span>Next Ep</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Subtle Mirror Server Hint */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-3 py-1.5 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-magenta-400" />
          <span>If current stream buffers, switch to Server 2 or Server 3 above.</span>
        </span>
      </div>
    </div>
  );
}
