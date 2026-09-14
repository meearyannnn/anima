"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  ArrowUp,
  RefreshCw,
  Volume2,
  VolumeX,
  Sliders,
  Columns2,
  FileText,
  Layers,
  Sparkles,
  Music,
  Coffee,
  Flame,
  Zap,
  Wind,
  Check,
  Eye,
  EyeOff,
  Palette,
  Moon,
} from "lucide-react";
import { AniListMedia } from "@/lib/types";
import { MangaChapter } from "@/lib/api/manga";
import { cn } from "@/lib/utils";
import { SaitamaLoader } from "@/components/ui/SaitamaLoader";
import { useMangaProgress } from "@/lib/store/useMangaProgress";
import {
  mangaAudioEngine,
  getRecommendedTheme,
  AMBIANCE_PRESETS,
  type AmbianceTheme,
} from "@/lib/utils/mangaAmbientAudio";

export type ReaderMode = "webtoon" | "dual" | "single";

interface MangaReaderClientProps {
  manga: AniListMedia;
  currentChapter: string;
  currentChapterId?: string;
  chapters: MangaChapter[];
  pages: string[];
}

export function MangaReaderClient({
  manga,
  currentChapter,
  currentChapterId,
  chapters,
  pages: initialPages,
}: MangaReaderClientProps) {
  const router = useRouter();
  const title = manga.title.english || manga.title.romaji;

  const [pages, setPages] = useState<string[]>(initialPages);
  const [loadingPages, setLoadingPages] = useState<boolean>(initialPages.length === 0);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // ── Smart Reading Mode ──
  const isDefaultWebtoon = manga.countryOfOrigin === "KR";
  const [readerMode, setReaderMode] = useState<ReaderMode>(isDefaultWebtoon ? "webtoon" : "webtoon");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // ── Ambient OST Sync ──
  const recommendedTheme = useMemo(
    () => getRecommendedTheme(manga.genres, manga.countryOfOrigin),
    [manga.genres, manga.countryOfOrigin]
  );
  const [activeAmbiance, setActiveAmbiance] = useState<AmbianceTheme>(recommendedTheme);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.3);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  // ── Progress Store ──
  const { saveProgress, getProgress } = useMangaProgress();
  const lastSavedProgress = getProgress(manga.id);

  // ── Kindle Immersion & Zen Focus Mode ──
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isKindleFocus, setIsKindleFocus] = useState(false);
  const [kindleTheme, setKindleTheme] = useState<"oled" | "charcoal" | "sepia">("oled");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, isKindleFocus ? 2000 : 3500);
  }, [isKindleFocus]);

  // Auto-hide controls on mouse movement
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY < 70 || e.clientY > window.innerHeight - 80) {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      } else {
        resetControlsTimer();
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimer]);

  // Hide controls on scroll down in webtoon mode
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120 && currentScrollY > lastScrollY) {
        setControlsVisible(false);
      } else if (currentScrollY < 60) {
        setControlsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Find previous and next chapters
  const currentIndex = chapters.findIndex(
    (c) => parseFloat(c.chapter) === parseFloat(currentChapter)
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  // Client-side fallback fetch if initialPages is empty
  useEffect(() => {
    setPages(initialPages);
    if (initialPages.length === 0) {
      let isMounted = true;
      setLoadingPages(true);
      setLoadError(false);

      const params = new URLSearchParams();
      if (currentChapterId) params.set("chId", currentChapterId);
      if (title) params.set("title", title);
      if (manga.title.romaji) params.set("romajiTitle", manga.title.romaji);
      params.set("chapter", currentChapter);

      fetch(`/api/manga-pages?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
            setPages(data.pages);
          } else {
            setLoadError(true);
          }
        })
        .catch(() => {
          if (isMounted) setLoadError(true);
        })
        .finally(() => {
          if (isMounted) setLoadingPages(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setLoadingPages(false);
      setLoadError(false);
    }
  }, [initialPages, currentChapter, currentChapterId, title, manga.title.romaji]);

  // ── Smart Progress Restoration (Silent, zero notification popups) ──
  const hasAutoResumedRef = useRef(false);
  useEffect(() => {
    if (pages.length > 0 && lastSavedProgress?.chapterNumber === currentChapter && !hasAutoResumedRef.current) {
      if (lastSavedProgress.pageIndex > 0) {
        hasAutoResumedRef.current = true;
        setCurrentPageIndex(lastSavedProgress.pageIndex);
        if (readerMode === "webtoon") {
          setTimeout(() => {
            const pageEl = document.getElementById(`manga-page-${lastSavedProgress.pageIndex}`);
            if (pageEl) {
              pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 350);
        }
      }
    }
  }, [pages.length, currentChapter, lastSavedProgress, readerMode]);

  // Save progress periodically & on scroll/page change
  useEffect(() => {
    if (pages.length === 0) return;

    saveProgress({
      mangaId: manga.id,
      title,
      chapterId: currentChapterId,
      chapterNumber: currentChapter,
      pageIndex: currentPageIndex,
      totalPages: pages.length,
      scrollPercentage: readProgress,
    });
  }, [pages.length, currentPageIndex, readProgress, manga.id, title, currentChapter, currentChapterId, saveProgress]);

  // Track Webtoon scroll progress & active page in view
  useEffect(() => {
    if (readerMode !== "webtoon") return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(
          100,
          Math.max(0, Math.round((window.scrollY / totalHeight) * 100))
        );
        setReadProgress(progress);

        // Determine current visible page index
        if (pages.length > 0) {
          const estimatedPage = Math.min(
            pages.length - 1,
            Math.floor((window.scrollY / totalHeight) * pages.length)
          );
          setCurrentPageIndex(estimatedPage);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readerMode, pages.length]);

  // ── Ambient OST Engine Control ──
  const toggleAudio = () => {
    if (isPlayingAudio) {
      mangaAudioEngine.stop();
      setIsPlayingAudio(false);
    } else {
      mangaAudioEngine.play(activeAmbiance);
      mangaAudioEngine.setVolume(audioVolume);
      setIsPlayingAudio(true);
    }
  };

  const handleSelectAmbiance = (theme: AmbianceTheme) => {
    setActiveAmbiance(theme);
    if (isPlayingAudio) {
      mangaAudioEngine.play(theme);
      mangaAudioEngine.setVolume(audioVolume);
    }
    setShowAudioMenu(false);
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    mangaAudioEngine.setVolume(vol);
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        mangaAudioEngine.stop();
      }
    };
  }, []);

  // ── Keyboard Navigation (Arrow keys, Fullscreen, Ambiance) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/select
      if (["INPUT", "SELECT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (readerMode === "webtoon") {
        if (e.key === "ArrowLeft" && prevChapter) {
          router.push(`/manga/${manga.id}/${prevChapter.chapter}?chId=${encodeURIComponent(prevChapter.id)}`);
        } else if (e.key === "ArrowRight" && nextChapter) {
          router.push(`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`);
        }
      } else if (readerMode === "dual") {
        if (e.key === "ArrowLeft") {
          if (currentPageIndex > 0) {
            setCurrentPageIndex((prev) => Math.max(0, prev - 2));
          } else if (prevChapter) {
            router.push(`/manga/${manga.id}/${prevChapter.chapter}?chId=${encodeURIComponent(prevChapter.id)}`);
          }
        } else if (e.key === "ArrowRight") {
          if (currentPageIndex + 2 < pages.length) {
            setCurrentPageIndex((prev) => prev + 2);
          } else if (nextChapter) {
            router.push(`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`);
          }
        }
      } else if (readerMode === "single") {
        if (e.key === "ArrowLeft") {
          if (currentPageIndex > 0) {
            setCurrentPageIndex((prev) => prev - 1);
          } else if (prevChapter) {
            router.push(`/manga/${manga.id}/${prevChapter.chapter}?chId=${encodeURIComponent(prevChapter.id)}`);
          }
        } else if (e.key === "ArrowRight") {
          if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex((prev) => prev + 1);
          } else if (nextChapter) {
            router.push(`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`);
          }
        }
      }

      if (e.key.toLowerCase() === "m") {
        toggleAudio();
      }
      if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
      if (e.key.toLowerCase() === "z" || e.key.toLowerCase() === "k") {
        setIsKindleFocus((prev) => !prev);
        setControlsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readerMode, currentPageIndex, pages.length, prevChapter, nextChapter, manga.id, router, isPlayingAudio, isKindleFocus]);

  // Update progress percentage in dual/single modes
  useEffect(() => {
    if (readerMode !== "webtoon" && pages.length > 0) {
      const step = readerMode === "dual" ? 2 : 1;
      const pct = Math.min(100, Math.round(((currentPageIndex + step) / pages.length) * 100));
      setReadProgress(pct);
    }
  }, [readerMode, currentPageIndex, pages.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const scrollToTop = () => {
    if (readerMode === "webtoon") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setCurrentPageIndex(0);
    }
  };

  const handleChapterSelect = (chNum: string) => {
    const selected = chapters.find((c) => c.chapter === chNum);
    if (selected) {
      router.push(`/manga/${manga.id}/${selected.chapter}?chId=${encodeURIComponent(selected.id)}`);
    }
  };

  const handleRetry = () => {
    setLoadingPages(true);
    setLoadError(false);
    const params = new URLSearchParams();
    if (currentChapterId) params.set("chId", currentChapterId);
    if (title) params.set("title", title);
    if (manga.title.romaji) params.set("romajiTitle", manga.title.romaji);
    params.set("chapter", currentChapter);

    fetch(`/api/manga-pages?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
          setPages(data.pages);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoadingPages(false));
  };

  const activeAmbiancePreset = AMBIANCE_PRESETS.find((p) => p.id === activeAmbiance) || AMBIANCE_PRESETS[0];

  const bgClass =
    kindleTheme === "oled"
      ? "bg-black"
      : kindleTheme === "sepia"
      ? "bg-[#141210]"
      : "bg-[#07070a]";

  return (
    <div
      onClick={(e) => {
        // Clicking container background toggles controls
        if (e.target === e.currentTarget) {
          setControlsVisible((prev) => !prev);
        }
      }}
      className={cn("min-h-screen text-white select-none transition-colors duration-500", bgClass)}
    >
      {/* ── Top Floating Glass Header Dock (Kindle Auto-Hiding) ── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-2.5 bg-black/90 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between gap-3 shadow-2xl transition-all duration-300 transform",
          controlsVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-full pointer-events-none"
        )}
      >
        {/* Left: Back & Title Info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/manga/${manga.id}`}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors flex-shrink-0"
            title="Back to Manga Overview"
          >
            <ArrowLeft size={17} />
          </Link>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">{title}</h1>
            <p className="text-[11px] text-magenta-400 font-semibold flex items-center gap-1.5">
              <span>Ch. {currentChapter}</span>
              {pages.length > 0 && (
                <span className="text-white/40">
                  • {readerMode === "webtoon" ? `${pages.length} Pages` : `Page ${currentPageIndex + 1} / ${pages.length}`}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Reader Mode Capsule Dock (Webtoon vs Dual vs Single) */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setReaderMode("webtoon")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
              readerMode === "webtoon"
                ? "bg-gradient-to-r from-magenta-500 to-pink-500 text-white shadow-[0_0_12px_rgba(255,42,133,0.4)]"
                : "text-white/60 hover:text-white"
            )}
            title="Webtoon Infinite Vertical Scroll"
          >
            <Layers size={13} />
            <span>Webtoon</span>
          </button>

          <button
            onClick={() => setReaderMode("dual")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
              readerMode === "dual"
                ? "bg-gradient-to-r from-magenta-500 to-pink-500 text-white shadow-[0_0_12px_rgba(255,42,133,0.4)]"
                : "text-white/60 hover:text-white"
            )}
            title="Classic Dual-Page Spread Book Mode"
          >
            <Columns2 size={13} />
            <span>Dual Page</span>
          </button>

          <button
            onClick={() => setReaderMode("single")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
              readerMode === "single"
                ? "bg-gradient-to-r from-magenta-500 to-pink-500 text-white shadow-[0_0_12px_rgba(255,42,133,0.4)]"
                : "text-white/60 hover:text-white"
            )}
            title="Focused Single Page Flip"
          >
            <FileText size={13} />
            <span>Single</span>
          </button>
        </div>

        {/* Right: Ambient Sound & Chapter Selectors */}
        <div className="flex items-center gap-2">
          {/* Ambient OST Sound Button */}
          <div className="relative">
            <button
              onClick={toggleAudio}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowAudioMenu(!showAudioMenu);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                isPlayingAudio
                  ? "bg-magenta-500/20 text-magenta-300 border-magenta-500/50 shadow-[0_0_15px_rgba(255,42,133,0.35)]"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white"
              )}
              title={isPlayingAudio ? `Ambiance: ${activeAmbiancePreset.name} (Click to pause, right-click to change)` : "Play Atmospheric OST Ambiance"}
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 size={14} className="text-magenta-400 animate-pulse" />
                  <span className="hidden lg:inline">{activeAmbiancePreset.name}</span>
                </>
              ) : (
                <>
                  <VolumeX size={14} />
                  <span className="hidden lg:inline">Ambiance</span>
                </>
              )}
            </button>

            {/* Ambient Audio Settings Trigger */}
            <button
              onClick={() => setShowAudioMenu(!showAudioMenu)}
              className="hidden sm:inline-flex p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 ml-1 transition-colors"
              title="Ambiance Options"
            >
              <Sliders size={12} />
            </button>

            {/* Audio Dropdown Popover */}
            <AnimatePresence>
              {showAudioMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-11 w-72 rounded-2xl bg-black/90 border border-white/15 p-4 shadow-2xl backdrop-blur-2xl z-50 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Music size={14} className="text-magenta-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Atmospheric OST</span>
                    </div>
                    <span className="text-[10px] text-magenta-400 font-mono font-bold">Auto-Synced</span>
                  </div>

                  {/* Presets List */}
                  <div className="space-y-1.5">
                    {AMBIANCE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectAmbiance(preset.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all border text-xs",
                          activeAmbiance === preset.id
                            ? "bg-magenta-500/20 text-white border-magenta-500/40 font-bold"
                            : "bg-white/[0.03] border-white/[0.06] text-white/70 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <div>
                          <p className="font-bold flex items-center gap-1.5">
                            {preset.id === "dark-fantasy" && <Flame size={12} className="text-magenta-400" />}
                            {preset.id === "cozy-lofi" && <Coffee size={12} className="text-emerald-400" />}
                            {preset.id === "cyberpunk" && <Zap size={12} className="text-cyan-400" />}
                            {preset.id === "zen-acoustic" && <Wind size={12} className="text-purple-400" />}
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-white/40 line-clamp-1">{preset.subtitle}</p>
                        </div>
                        {activeAmbiance === preset.id && <Check size={14} className="text-magenta-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {/* Volume Slider */}
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-white/50 font-bold uppercase">
                      <span>Volume</span>
                      <span>{Math.round(audioVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={audioVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-magenta-500 h-1 bg-white/20 rounded-full cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chapter Selector Dropdown */}
          <select
            value={currentChapter}
            onChange={(e) => handleChapterSelect(e.target.value)}
            className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-magenta-500/50 cursor-pointer max-w-[110px] sm:max-w-[150px] truncate"
          >
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.chapter} className="bg-black text-white">
                Ch. {ch.chapter} {ch.title !== `Chapter ${ch.chapter}` ? `— ${ch.title}` : ""}
              </option>
            ))}
          </select>

          {/* Kindle Focus Mode Button */}
          <button
            onClick={() => {
              const next = !isKindleFocus;
              setIsKindleFocus(next);
              if (next) {
                setControlsVisible(false);
              } else {
                setControlsVisible(true);
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
              isKindleFocus
                ? "bg-magenta-500 text-white border-magenta-400 shadow-[0_0_15px_rgba(255,42,133,0.5)]"
                : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10"
            )}
            title="Kindle Zen Focus Mode (Press Z or K to toggle)"
          >
            {isKindleFocus ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="hidden md:inline">{isKindleFocus ? "Exit Focus" : "Kindle Focus"}</span>
          </button>

          {/* Kindle Canvas Theme Switcher */}
          <button
            onClick={() => {
              setKindleTheme((prev) =>
                prev === "oled" ? "charcoal" : prev === "charcoal" ? "sepia" : "oled"
              );
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors border border-white/10"
            title={`Reading Canvas Theme: ${kindleTheme.toUpperCase()} (Click to cycle)`}
          >
            {kindleTheme === "oled" && <Moon size={15} className="text-white/80" />}
            {kindleTheme === "charcoal" && <Palette size={15} className="text-cyan-400" />}
            {kindleTheme === "sepia" && <Palette size={15} className="text-amber-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Reading Progress Indicator Bar */}
      <div
        className={cn(
          "fixed top-[53px] left-0 right-0 h-1 bg-white/5 z-50 transition-all duration-300",
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-magenta-500 via-pink-500 to-rose-400 shadow-[0_0_10px_rgba(255,42,133,0.8)] transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* ── Main Manga Content Area ── */}
      <main className="pt-20 pb-28 min-h-screen px-2 sm:px-4 flex flex-col items-center">
        {loadingPages ? (
          <div className="w-full max-w-md my-24 flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center">
            <SaitamaLoader size="md" text={`Loading Chapter ${currentChapter}...`} />
            <p className="text-xs text-white/50 mt-2">Fetching high-definition manga pages...</p>
          </div>
        ) : pages.length > 0 ? (
          <>
            {/* ── MODE 1: Webtoon Vertical Infinite Scroll ── */}
            {readerMode === "webtoon" && (
              <div className="w-full max-w-3xl flex flex-col items-center space-y-1 sm:space-y-2">
                {pages.map((pageUrl, idx) => (
                  <div
                    key={idx}
                    id={`manga-page-${idx}`}
                    className="relative w-full overflow-hidden bg-black/80 rounded-sm shadow-xl min-h-[400px] flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pageUrl}
                      alt={`Chapter ${currentChapter} - Page ${idx + 1}`}
                      loading={idx < 3 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full h-auto block select-none"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes("/api/manga-proxy")) {
                          target.src = `/api/manga-proxy?url=${encodeURIComponent(pageUrl)}`;
                        }
                      }}
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-white/60 font-mono pointer-events-none">
                      {idx + 1} / {pages.length}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── MODE 2: Dual-Page Spread (Classic Manga Book) ── */}
            {readerMode === "dual" && (
              <div className="w-full max-w-6xl flex flex-col items-center justify-center my-4">
                <div className="relative w-full grid grid-cols-1 md:grid-cols-2 gap-2 bg-black/90 rounded-2xl p-2 border border-white/10 shadow-2xl min-h-[600px] items-center">
                  {/* Left Page (Japanese manga reads right-to-left: pageIndex+1 or pageIndex) */}
                  <div className="relative w-full h-full flex items-center justify-center bg-black/60 rounded-xl overflow-hidden min-h-[500px]">
                    {pages[currentPageIndex] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={pages[currentPageIndex]}
                        alt={`Page ${currentPageIndex + 1}`}
                        className="max-h-[85vh] w-auto object-contain select-none"
                      />
                    ) : (
                      <div className="text-white/20 text-sm">Blank Page</div>
                    )}
                    <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-white/60 border border-white/10">
                      Page {currentPageIndex + 1}
                    </span>
                  </div>

                  {/* Right Page */}
                  <div className="relative w-full h-full flex items-center justify-center bg-black/60 rounded-xl overflow-hidden min-h-[500px]">
                    {pages[currentPageIndex + 1] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={pages[currentPageIndex + 1]}
                        alt={`Page ${currentPageIndex + 2}`}
                        className="max-h-[85vh] w-auto object-contain select-none"
                      />
                    ) : (
                      <div className="text-white/20 text-sm">End of Chapter</div>
                    )}
                    {pages[currentPageIndex + 1] && (
                      <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-white/60 border border-white/10">
                        Page {currentPageIndex + 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dual Mode Page Turn Buttons */}
                <div className="flex items-center justify-between w-full max-w-lg mt-6 px-4">
                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 2))}
                    disabled={currentPageIndex === 0 && !prevChapter}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-all"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous Spread</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-white/60">
                    Pages {currentPageIndex + 1}-{Math.min(currentPageIndex + 2, pages.length)} of {pages.length}
                  </span>

                  <button
                    onClick={() => {
                      if (currentPageIndex + 2 < pages.length) {
                        setCurrentPageIndex((prev) => prev + 2);
                      } else if (nextChapter) {
                        router.push(`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`);
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(255,42,133,0.3)] hover:scale-105 transition-all"
                  >
                    <span>{currentPageIndex + 2 >= pages.length ? "Next Chapter" : "Next Spread"}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── MODE 3: Single Page Flip Mode ── */}
            {readerMode === "single" && (
              <div className="w-full max-w-2xl flex flex-col items-center justify-center my-4">
                <div className="relative w-full flex items-center justify-center bg-black/80 rounded-2xl p-2 border border-white/10 shadow-2xl min-h-[550px]">
                  {pages[currentPageIndex] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={pages[currentPageIndex]}
                      alt={`Page ${currentPageIndex + 1}`}
                      className="max-h-[85vh] w-auto object-contain select-none"
                    />
                  )}
                  <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/80 text-[11px] font-mono text-white/70 border border-white/10">
                    {currentPageIndex + 1} / {pages.length}
                  </span>
                </div>

                {/* Single Mode Navigation */}
                <div className="flex items-center justify-between w-full mt-6 px-4">
                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white font-bold text-xs border border-white/10 transition-all"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-white/60">
                    Page {currentPageIndex + 1} of {pages.length}
                  </span>

                  <button
                    onClick={() => {
                      if (currentPageIndex < pages.length - 1) {
                        setCurrentPageIndex((prev) => prev + 1);
                      } else if (nextChapter) {
                        router.push(`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(255,42,133,0.3)] hover:scale-105 transition-all"
                  >
                    <span>{currentPageIndex >= pages.length - 1 ? "Next Chapter" : "Next Page"}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Error State */
          <div className="w-full max-w-md my-24 p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center">
            <div className="w-14 h-14 rounded-full bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Chapter {currentChapter}</h2>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              Unable to load chapter pages at this moment. Please try refreshing.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,42,133,0.4)] transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Retry Loading Chapter</span>
            </button>
          </div>
        )}

        {/* End of Chapter Navigation Card */}
        {pages.length > 0 && (
          <div className="w-full max-w-2xl mt-12 p-6 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-2xl text-center shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">
              Finished Chapter {currentChapter}!
            </h3>
            <p className="text-xs text-white/50 mb-5">
              Continue reading with the next chapter.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {nextChapter ? (
                <Link
                  href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,42,133,0.4)] hover:scale-105 transition-all"
                >
                  <span>Next: Chapter {nextChapter.chapter}</span>
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="text-xs text-white/40">You have reached the latest chapter!</span>
              )}

              <Link
                href={`/manga/${manga.id}`}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold border border-white/10 transition-all"
              >
                Back to Manga Hub
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ── Floating Bottom Navigation Bar Dock (Kindle Auto-Hiding) ── */}
      <div
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-2xl border border-white/15 shadow-2xl text-xs font-semibold transition-all duration-300 transform",
          controlsVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-12 pointer-events-none"
        )}
      >
        {prevChapter && (
          <Link
            href={`/manga/${manga.id}/${prevChapter.chapter}?chId=${encodeURIComponent(prevChapter.id)}`}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Previous Chapter"
          >
            <ChevronLeft size={16} />
          </Link>
        )}

        {/* Mobile View Mode Switcher trigger */}
        <div className="flex md:hidden items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <button
            onClick={() => {
              const nextMode: ReaderMode = readerMode === "webtoon" ? "dual" : readerMode === "dual" ? "single" : "webtoon";
              setReaderMode(nextMode);
            }}
            className="px-2 py-1 rounded-full bg-white/10 text-[10px] text-magenta-300 font-bold uppercase"
          >
            {readerMode}
          </button>
        </div>

        <button
          onClick={scrollToTop}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors"
        >
          <ArrowUp size={13} />
          <span>{readProgress}%</span>
        </button>

        {nextChapter && (
          <Link
            href={`/manga/${manga.id}/${nextChapter.chapter}?chId=${encodeURIComponent(nextChapter.id)}`}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Next Chapter"
          >
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      {/* ── Kindle Minimalist Status Watermark ── */}
      <div
        className={cn(
          "fixed bottom-2 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 pointer-events-none transition-opacity duration-500 text-[11px] font-mono tracking-wider",
          controlsVisible ? "opacity-0" : "opacity-35"
        )}
      >
        <span className="text-white/80">
          {readerMode === "webtoon"
            ? `${readProgress}% read`
            : `Page ${currentPageIndex + 1} / ${pages.length} (${readProgress}%)`}
        </span>
        <span className="text-white/60 truncate max-w-[200px] sm:max-w-md text-right">
          {title} • Ch. {currentChapter}
        </span>
      </div>
    </div>
  );
}

