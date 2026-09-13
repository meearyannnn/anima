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
}

const SERVERS: { id: EmbedProvider; name: string; tag: string; badgeColor: string }[] = [
  { id: "vidrock", name: "VidRock", tag: "Primary • Yt / Fm / Vn", badgeColor: "bg-magenta-500/10 text-magenta-300 border-magenta-500/30" },
  { id: "vidlink", name: "VidLink", tag: "Clean Anime UI", badgeColor: "bg-white/10 text-white border-white/20" },
  { id: "2embed", name: "2Embed", tag: "HQ Multi-Sub", badgeColor: "bg-magenta-500/10 text-magenta-300 border-magenta-500/30" },
  { id: "vidsrc", name: "VidSrc", tag: "Backup Mirror", badgeColor: "bg-white/10 text-white border-white/20" },
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
  const [showQualityPanel, setShowQualityPanel] = useState(false);
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

      {/* Top player toolbar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 bg-kuro-surface/90 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-xl shadow-lg">
        {/* Server Selection Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 mr-2 tracking-wider">
            <Zap size={15} className="text-magenta-400" />
            <span>SERVER:</span>
          </div>

          {SERVERS.map((srv) => {
            const isActive = selectedServer === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => handleServerChange(srv.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border",
                  isActive
                    ? "bg-magenta-500 text-white border-magenta-500 font-bold shadow-[0_0_15px_rgba(255,42,133,0.45)]"
                    : "bg-white/[0.03] border-white/[0.06] text-kuro-text-dim hover:text-white hover:bg-white/[0.08]"
                )}
              >
                <span className="font-bold">{srv.name}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md border font-semibold",
                    isActive
                      ? "bg-black/20 text-white border-black/20"
                      : srv.badgeColor
                  )}
                >
                  {srv.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right utility buttons: Ambient, Quality, Settings, Reload, PiP, Theater */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ambient Lighting Toggle */}
          <button
            onClick={cycleAmbientMode}
            title={`Ambient Mode: ${ambientMode === "magenta" ? "Cyber Magenta" : ambientMode === "reactive" ? "Reactive Pulse" : "Off"}`}
            className={cn(
              "p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5",
              ambientMode !== "off"
                ? "bg-magenta-500/20 border-magenta-500/50 text-magenta-400 shadow-[0_0_12px_rgba(255,42,133,0.3)]"
                : "bg-white/[0.03] border-white/[0.06] text-white/60 hover:text-white"
            )}
          >
            <Sun size={15} className={ambientMode === "reactive" ? "animate-spin" : ""} />
            <span className="hidden md:inline">
              {ambientMode === "magenta" ? "Ambient On" : ambientMode === "reactive" ? "Pulse" : "Ambient Off"}
            </span>
          </button>

          {/* Quality & Audio Switcher Panel */}
          <button
            onClick={() => {
              setShowQualityPanel(!showQualityPanel);
              setShowSettings(false);
            }}
            title="Stream Quality & Audio Mode"
            className={cn(
              "p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5",
              showQualityPanel
                ? "bg-magenta-500/20 border-magenta-500/50 text-magenta-400"
                : "bg-white/[0.03] border-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline font-mono">{selectedQuality}</span>
          </button>

          {/* Cinema Mode Toggle */}
          {onToggleCinema && (
            <button
              onClick={onToggleCinema}
              title={isCinemaMode ? "Exit Cinema Mode (Esc / C)" : "Enter Cinema Mode (C)"}
              className={cn(
                "px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5",
                isCinemaMode
                  ? "bg-magenta-500 text-white border-magenta-500 shadow-[0_0_15px_rgba(255,42,133,0.6)] animate-pulse"
                  : "bg-white/[0.03] border-white/[0.06] text-white/80 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              <Sparkles size={14} className={isCinemaMode ? "fill-white" : "text-magenta-400"} />
              <span className="hidden sm:inline font-bold">Cinema</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/15 text-white font-mono hidden md:inline">
                C
              </span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowQualityPanel(false);
            }}
            title="Player Preferences"
            className={cn(
              "p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5",
              showSettings
                ? "bg-magenta-500/20 border-magenta-500/50 text-magenta-400"
                : "bg-white/[0.03] border-white/[0.06] text-kuro-text-dim hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Settings size={15} />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Mini-Player / PiP Button */}
          {onTogglePip && (
            <button
              onClick={onTogglePip}
              title={isPipActive ? "Dock Player" : "Picture in Picture Mini-Player"}
              className={cn(
                "p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 hidden sm:inline-flex",
                isPipActive
                  ? "bg-magenta-500 text-white border-magenta-500 font-bold shadow-sm"
                  : "bg-white/[0.03] border-white/[0.06] text-kuro-text-dim hover:text-white hover:bg-white/[0.08]"
              )}
            >
              <Tv size={15} />
              <span className="hidden md:inline">PiP</span>
            </button>
          )}

          {/* Reload button */}
          <button
            onClick={handleReload}
            title="Reload Video Player"
            className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] text-kuro-text-dim hover:text-white transition-colors"
          >
            <RotateCcw size={15} />
          </button>

          {/* Theater mode toggle */}
          <button
            onClick={() => setTheaterMode(!theaterMode)}
            title={theaterMode ? "Exit Theater Mode" : "Theater Mode"}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] text-kuro-text-dim hover:text-white transition-colors hidden sm:inline-flex"
          >
            {theaterMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Open in new window */}
          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            title="Open in new window"
            className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] text-kuro-text-dim hover:text-white transition-colors"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* Quality & Audio Switcher Drawer Panel */}
      <AnimatePresence>
        {showQualityPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="bg-kuro-surface/95 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-magenta-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Stream Quality & Audio Modes
                  </span>
                </div>
                <button
                  onClick={() => setShowQualityPanel(false)}
                  className="p-1 text-white/50 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Resolution selector */}
                <div>
                  <p className="text-white/60 font-bold mb-2 uppercase tracking-wide text-[10px]">
                    Video Resolution:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {QUALITIES.map((q) => {
                      const isActive = selectedQuality === q.id;
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setSelectedQuality(q.id);
                            savePref("kuro_player_quality", q.id);
                          }}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all",
                            isActive
                              ? "bg-magenta-500/15 border-magenta-500 text-white font-bold"
                              : "bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/[0.05]"
                          )}
                        >
                          <div>
                            <p className="font-bold text-white">{q.label}</p>
                            <p className="text-[10px] text-white/50">{q.desc}</p>
                          </div>
                          {isActive && <Check size={16} className="text-magenta-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Audio Mode & Fast Download */}
                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-white/60 font-bold mb-2 uppercase tracking-wide text-[10px]">
                      Audio Track (Sub / Dub):
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAudioMode("sub")}
                        className={cn(
                          "px-3 py-2.5 rounded-xl border font-bold text-center transition-all",
                          audioMode === "sub"
                            ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-sm"
                            : "bg-white/[0.02] border-white/[0.06] text-white/70 hover:text-white"
                        )}
                      >
                        Sub (Original)
                      </button>
                      <button
                        onClick={() => setAudioMode("dub")}
                        className={cn(
                          "px-3 py-2.5 rounded-xl border font-bold text-center transition-all",
                          audioMode === "dub"
                            ? "bg-magenta-500 text-white border-magenta-500 font-black shadow-sm"
                            : "bg-white/[0.02] border-white/[0.06] text-white/70 hover:text-white"
                        )}
                      >
                        English Dub
                      </button>
                    </div>
                  </div>

                  {/* Direct Download Trigger */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-xs">Offline Download</p>
                      <p className="text-[10px] text-white/50">Save episode via mirror stream</p>
                    </div>
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-magenta-500 hover:text-white border border-white/15 text-white font-bold transition-all text-xs"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Drawer Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="bg-kuro-surface/95 border border-kuro-border/80 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                {/* Autoplay toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-kuro-text-dim hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={autoplay}
                    onChange={(e) => {
                      setAutoplay(e.target.checked);
                      savePref("kuro_player_autoplay", String(e.target.checked));
                      setIframeKey((k) => k + 1);
                    }}
                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-magenta-500 focus:ring-magenta-500 accent-magenta-500"
                  />
                  <span>Autoplay Video</span>
                </label>


                {/* Subtitle language */}
                <div className="flex items-center gap-2 text-xs">
                  <Globe size={14} className="text-magenta-400" />
                  <span className="text-kuro-text-dim">Subtitles:</span>
                  <select
                    value={subLang}
                    onChange={(e) => {
                      setSubLang(e.target.value);
                      savePref("kuro_player_lang", e.target.value);
                      setIframeKey((k) => k + 1);
                    }}
                    className="bg-kuro-card border border-kuro-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-magenta-500 cursor-pointer"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Theme Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles size={14} className="text-magenta-400" />
                  <span className="text-kuro-text-dim">Accent Theme:</span>
                  <div className="flex items-center gap-1.5">
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
                          "w-5 h-5 rounded-full transition-transform",
                          t.bg,
                          selectedTheme === t.hex ? "scale-125 ring-2 ring-white" : "opacity-60 hover:opacity-100"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-kuro-muted hover:text-white px-2 py-1"
              >
                Done
              </button>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-kuro-bg/95 z-20 gap-3 backdrop-blur-md">
            <div
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `#${selectedTheme}`, borderTopColor: "transparent" }}
            />
            <p className="text-xs text-kuro-text font-medium">Connecting to {selectedServer} stream...</p>
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

      {/* Embedded Player Info & Tips Banner */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-kuro-surface/60 border border-white/10 text-xs text-white/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-magenta-400 flex-shrink-0" />
          <span>
            <strong className="text-white">VidRock Multi-Mirror:</strong> You can switch audio language, subtitle track, and internal servers (Yt, Fm-Hls, Vn-Hls) directly inside the video controls. If any server buffers, use the server buttons above.
          </span>
        </div>
      </div>
    </div>
  );
}
