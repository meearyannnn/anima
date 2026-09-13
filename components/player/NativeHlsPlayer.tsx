"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  FastForward,
  Rewind,
  Settings,
  Sparkles,
  Tv,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  SlidersHorizontal,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchHistory, formatTimestamp } from "@/lib/store/useWatchHistory";
import { SaitamaLoader } from "@/components/ui/SaitamaLoader";

export interface NativeHlsPlayerProps {
  streamUrl: string;
  animeId: number;
  season?: number;
  episode?: number;
  isMovie?: boolean;
  title?: string;
  episodeName?: string;
  coverImage?: string;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  onFallbackToMirror?: () => void;
  jumpToTime?: number | null;
}

export function NativeHlsPlayer({
  streamUrl,
  animeId,
  season = 1,
  episode = 1,
  isMovie = false,
  title = "Anime",
  episodeName,
  coverImage = "",
  hasNext,
  hasPrev,
  onNextEpisode,
  onPrevEpisode,
  onFallbackToMirror,
  jumpToTime,
}: NativeHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Jump to specific timestamp when requested by external timeline triggers
  useEffect(() => {
    if (typeof jumpToTime === "number" && videoRef.current) {
      videoRef.current.currentTime = jumpToTime;
      videoRef.current.play().catch(() => {});
    }
  }, [jumpToTime]);

  const { savePlaybackTimestamp, getPlaybackTimestamp } = useWatchHistory();

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [resumeBanner, setResumeBanner] = useState<{ formatted: string; time: number } | null>(null);

  // Quality levels & Audio tracks from HLS
  const [qualityLevels, setQualityLevels] = useState<{ index: number; label: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string }[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Auto-Resume Check on Mount ──────────────────────────────────────────
  useEffect(() => {
    const saved = getPlaybackTimestamp(animeId, episode, season);
    if (saved && saved.currentTime > 15) {
      setResumeBanner({
        formatted: saved.formatted,
        time: saved.currentTime,
      });
    } else {
      setResumeBanner(null);
    }
  }, [animeId, episode, season, getPlaybackTimestamp]);

  // ─── Initialize HLS.js ───────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsBuffering(true);

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsBuffering(false);
        // Extract available quality levels
        const levels = data.levels.map((lvl, index) => ({
          index,
          label: lvl.height ? `${lvl.height}p` : `Stream ${index + 1}`,
        }));
        setQualityLevels(levels);

        // Resume playback if saved time exists
        const saved = getPlaybackTimestamp(animeId, episode, season);
        if (saved && saved.currentTime > 15 && (!saved.duration || saved.currentTime < saved.duration - 30)) {
          video.currentTime = saved.currentTime;
        }

        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        setAudioTracks(data.audioTracks.map((t) => ({ id: t.id, name: t.name || t.lang || "Audio" })));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              // Fallback to mirror if direct stream is dead
              if (onFallbackToMirror) onFallbackToMirror();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native iOS Safari HLS support
      video.src = streamUrl;
      const saved = getPlaybackTimestamp(animeId, episode, season);
      if (saved && saved.currentTime > 15) {
        video.currentTime = saved.currentTime;
      }
      video.play().catch(() => setIsPlaying(false));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, animeId, episode, season, getPlaybackTimestamp, onFallbackToMirror]);

  // ─── Time Update & Auto-Save Timestamp ──────────────────────────────────
  const lastSaveRef = useRef<number>(0);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const cur = video.currentTime;
    const dur = video.duration || 1440;
    setCurrentTime(cur);
    setDuration(dur);

    // Track buffer progress
    if (video.buffered.length > 0) {
      setBufferedEnd(video.buffered.end(video.buffered.length - 1));
    }

    // Save timestamp every 4 seconds to localStorage
    const now = Date.now();
    if (now - lastSaveRef.current > 4000 && cur > 5) {
      lastSaveRef.current = now;
      savePlaybackTimestamp(animeId, episode, cur, dur, season, title, coverImage);
    }
  }, [animeId, episode, season, title, coverImage, savePlaybackTimestamp]);

  // Save on pause or before unload
  const saveImmediate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    savePlaybackTimestamp(animeId, episode, video.currentTime, video.duration || 1440, season, title, coverImage);
  }, [animeId, episode, season, title, coverImage, savePlaybackTimestamp]);

  useEffect(() => {
    window.addEventListener("beforeunload", saveImmediate);
    return () => {
      saveImmediate();
      window.removeEventListener("beforeunload", saveImmediate);
    };
  }, [saveImmediate]);

  // ─── Controls Visibility & Idle Dimming ──────────────────────────────────
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 2800);
    }
  }, [isPlaying]);

  // ─── Playback Actions ────────────────────────────────────────────────────
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      saveImmediate();
    }
    resetControlsTimeout();
  };

  const seekRelative = (offsetSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 1440, video.currentTime + offsetSeconds));
    resetControlsTimeout();
  };

  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    video.volume = clamped;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
  };

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
    }
    setShowSettings(false);
  };

  const handleAudioChange = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setCurrentAudioTrack(trackId);
    }
    setShowSettings(false);
  };

  const toggleFullscreen = async () => {
    const player = playerRef.current;
    if (!player) return;
    if (!document.fullscreenElement) {
      await player.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video !== document.pictureInPictureElement && document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PiP failed:", e);
    }
  };

  // ─── Keyboard Shortcuts Handler ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          seekRelative(10);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "n":
          if (hasNext && onNextEpisode) {
            e.preventDefault();
            onNextEpisode();
          }
          break;
        case "p":
          if (hasPrev && onPrevEpisode) {
            e.preventDefault();
            onPrevEpisode();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [volume, isPlaying, hasNext, hasPrev, onNextEpisode, onPrevEpisode]);

  // ─── Scrubber Drag & Click Handling ──────────────────────────────────────
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * (duration || 1);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(e.clientX - rect.left);
    setHoverTime(pos * (duration || 1));
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={playerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={cn(
        "relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 group select-none"
      )}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Buffering & Saitama Loading Overlay */}
      {isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-xs pointer-events-none">
          <SaitamaLoader size="sm" text="Buffering Stream..." />
        </div>
      )}

      {/* Auto-Resume Notification Banner */}
      <AnimatePresence>
        {resumeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/80 border border-magenta-500/40 backdrop-blur-xl shadow-xl text-xs font-semibold text-white"
          >
            <Clock size={14} className="text-magenta-400" />
            <span>Resumed from {resumeBanner.formatted}</span>
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
                setResumeBanner(null);
              }}
              className="text-magenta-400 hover:text-magenta-300 font-bold underline text-[11px] ml-1 cursor-pointer"
            >
              Start Over
            </button>
            <button
              onClick={() => setResumeBanner(null)}
              className="text-white/40 hover:text-white p-0.5 ml-1"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Overlay: Title & Source Switcher */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 pointer-events-auto",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 text-white text-xs font-bold truncate max-w-md">
          <span className="px-2 py-0.5 rounded-lg bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 text-[10px] font-mono font-black">
            NATIVE HLS
          </span>
          <span className="truncate">{title}</span>
          <span className="text-white/40">•</span>
          <span className="text-magenta-400 font-mono text-[11px]">
            {isMovie ? "Movie" : `S${season} • E${episode}`}
          </span>
        </div>

        {/* Fallback to Embed Mirror Button */}
        {onFallbackToMirror && (
          <button
            onClick={onFallbackToMirror}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white/80 hover:text-white text-xs font-bold transition-all"
            title="Switch to VidRock / VidLink mirror embed"
          >
            <Layers size={13} className="text-magenta-400" />
            <span>Switch to Embed Mirror</span>
          </button>
        )}
      </div>

      {/* Big Center Play/Pause Pulsing Icon */}
      {!isPlaying && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 group/center"
          aria-label="Play video"
        >
          <div className="w-16 h-16 rounded-full bg-magenta-500/90 text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,42,133,0.6)] group-hover/center:scale-110 transition-transform">
            <Play size={26} className="fill-white translate-x-0.5" />
          </div>
        </button>
      )}

      {/* ─── Bottom Custom Player Controls Bar ──────────────────────────────── */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-20 px-4 py-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 flex flex-col gap-2",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Interactive Scrubber Bar */}
        <div
          onClick={handleScrubberClick}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          className="relative w-full h-3 flex items-center cursor-pointer group/scrub"
        >
          {/* Time Preview Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 px-2 py-0.5 rounded-md bg-black/90 border border-white/20 text-[10px] font-mono text-white pointer-events-none -translate-x-1/2 shadow-lg"
              style={{ left: `${hoverPosition}px` }}
            >
              {formatTimestamp(hoverTime)}
            </div>
          )}

          {/* Background track */}
          <div className="relative w-full h-1.5 group-hover/scrub:h-2.5 rounded-full bg-white/20 overflow-hidden transition-all">
            {/* Buffered range */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/30 transition-all"
              style={{ width: `${bufferPercent}%` }}
            />
            {/* Played progress */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-magenta-500 to-pink-500 transition-all shadow-[0_0_10px_rgba(255,42,133,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Scrubber Thumb */}
          <div
            className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,42,133,1)] opacity-0 group-hover/scrub:opacity-100 transition-opacity -translate-x-1/2 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-3 text-white">
          {/* Left Buttons: Play, Rewind, Forward, Volume, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              title={isPlaying ? "Pause (Space/K)" : "Play (Space/K)"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
            </button>

            <button
              onClick={() => seekRelative(-10)}
              className="p-1.5 text-white/70 hover:text-white transition-colors"
              title="Rewind 10s (Left/J)"
            >
              <Rewind size={16} />
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="p-1.5 text-white/70 hover:text-white transition-colors"
              title="Forward 10s (Right/L)"
            >
              <FastForward size={16} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 text-white/70 hover:text-white transition-colors"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 accent-magenta-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Current / Duration Time Display */}
            <div className="text-xs font-mono font-bold text-white/70">
              <span className="text-white">{formatTimestamp(currentTime)}</span>
              <span className="mx-1 text-white/30">/</span>
              <span>{formatTimestamp(duration)}</span>
            </div>
          </div>

          {/* Right Buttons: Prev/Next, Speed/Quality, PiP, Cinema, Fullscreen */}
          <div className="flex items-center gap-2 relative">
            {/* Prev / Next Episode Buttons */}
            {!isMovie && (
              <div className="flex items-center gap-1">
                <button
                  onClick={onPrevEpisode}
                  disabled={!hasPrev}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous Episode (P)"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={onNextEpisode}
                  disabled={!hasNext}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next Episode (N)"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Settings & Quality Drawer Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Stream Settings & Quality"
            >
              <Settings size={16} />
            </button>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
              title="Picture in Picture"
            >
              <Tv size={16} />
            </button>


            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-16 right-4 z-30 w-64 p-4 rounded-2xl bg-kuro-surface/95 border border-white/15 backdrop-blur-xl shadow-2xl text-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-black text-white uppercase tracking-wider text-[11px]">
                Playback Settings
              </span>
              <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {/* Playback Speed */}
            <div>
              <p className="text-white/50 font-bold mb-1.5 uppercase text-[10px]">Speed</p>
              <div className="flex items-center gap-1 flex-wrap">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={cn(
                      "px-2 py-1 rounded-lg font-mono font-bold transition-all",
                      playbackSpeed === s
                        ? "bg-magenta-500 text-white shadow-sm"
                        : "bg-white/[0.04] text-white/60 hover:text-white"
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Selector */}
            {qualityLevels.length > 0 && (
              <div>
                <p className="text-white/50 font-bold mb-1.5 uppercase text-[10px]">Quality</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1 rounded-lg text-left transition-all",
                      currentQuality === -1 ? "bg-magenta-500 text-white font-bold" : "text-white/70 hover:bg-white/5"
                    )}
                  >
                    <span>Auto</span>
                    {currentQuality === -1 && <Check size={12} />}
                  </button>
                  {qualityLevels.map((lvl) => (
                    <button
                      key={lvl.index}
                      onClick={() => handleQualityChange(lvl.index)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1 rounded-lg text-left transition-all",
                        currentQuality === lvl.index ? "bg-magenta-500 text-white font-bold" : "text-white/70 hover:bg-white/5"
                      )}
                    >
                      <span>{lvl.label}</span>
                      {currentQuality === lvl.index && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Track Selector */}
            {audioTracks.length > 1 && (
              <div>
                <p className="text-white/50 font-bold mb-1.5 uppercase text-[10px]">Audio Track</p>
                <div className="flex flex-col gap-1">
                  {audioTracks.map((trk) => (
                    <button
                      key={trk.id}
                      onClick={() => handleAudioChange(trk.id)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1 rounded-lg text-left transition-all",
                        currentAudioTrack === trk.id ? "bg-magenta-500 text-white font-bold" : "text-white/70 hover:bg-white/5"
                      )}
                    >
                      <span>{trk.name}</span>
                      {currentAudioTrack === trk.id && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
